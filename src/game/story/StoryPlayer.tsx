import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ScreenId } from "../../app/routes";
import { getBaseCampMap } from "../../data/baseCampMaps";
import type {
  StoryRenderState,
  StorySequence,
  StoryVisualAsset,
} from "../../types/story";
import { StoryStepRunner } from "./StoryStepRunner";
import {
  BaseCampStoryAdapter,
  type BaseCampStoryController,
} from "./BaseCampStoryAdapter";
import { PlayerStatusBar } from "../../components/PlayerStatusBar";
import type { PlayerState } from "../player/playerState";
import {
  DEFAULT_STORY_PRESENTATION_MODE,
  shouldShowStoryPlayerStatus,
  type StoryPresentationMode,
} from "./storyPresentationTypes";
import { StoryChoiceList } from "../../components/StoryChoiceList";
import type { StoryChoiceOption } from "../../types/story";
import { StoryNpcRenderer } from "./StoryNpcRenderer";
import { STORY_NPC_ASSET_URLS } from "./storyNpcRegistry";

type StoryPlayerProps = {
  sequence: StorySequence;
  onNavigate: (screen: ScreenId) => void;
  onComplete?: () => void;
  onStoryStarted?: (storyId: string) => void;
  onCheckpointReached?: (storyId: string, checkpointId: string) => void;
  onStoryCompleted?: (storyId: string) => void;
  playerStatus?: PlayerState;
  presentationMode?: StoryPresentationMode;
  onChoiceAction?: (actionId: string) => void;
  playerName?: string;
};

const INITIAL_RENDER_STATE: StoryRenderState = {
  backgroundId: null,
  backgroundTransition: "none",
  backgroundRevision: 0,
  portraits: {},
  dialogue: null,
  baseCampMapId: null,
  fade: { visible: false, color: "#000000", durationMs: 0 },
  camera: {
    x: 0, y: 0, zoom: 1, durationMs: 0,
    shakeDurationMs: 0, shakeAmplitude: 0, shakeRevision: 0,
  },
  storyNpcs: {},
  illust: { imageUrl: null, visible: false, fadeMs: 250 },
};

function createInitialRenderState(sequence: StorySequence): StoryRenderState {
  if (sequence.id !== "intro-scene-1") {
    return INITIAL_RENDER_STATE;
  }

  return {
    ...INITIAL_RENDER_STATE,
    camera: {
      ...INITIAL_RENDER_STATE.camera,
      x: 115,
      y: 100,
      zoom: 0.78,
    },
  };
}

function collectImageUrls(sequence: StorySequence) {
  const assets: StoryVisualAsset[] = [
    ...Object.values(sequence.backgrounds),
    ...Object.values(sequence.actors).flatMap((actor) =>
      Object.values(actor.portraits),
    ),
  ];

  return [
    ...new Set([
      ...assets.flatMap((asset) => [
        ...(asset.imageUrl ? [asset.imageUrl] : []),
        ...(asset.layers?.map((layer) => layer.imageUrl) ?? []),
      ]),
      ...sequence.scenes.flatMap((scene) =>
        scene.steps.flatMap((step) =>
          step.type === "illustOverlay" && step.imageUrl
            ? [step.imageUrl]
            : [],
        ),
      ),
      ...STORY_NPC_ASSET_URLS,
    ]),
  ];
}

function StoryAsset({
  asset,
  alt,
  failedUrls,
  onImageError,
}: {
  asset: StoryVisualAsset;
  alt: string;
  failedUrls: ReadonlySet<string>;
  onImageError: (url: string) => void;
}) {
  const canShowImage = asset.imageUrl && !failedUrls.has(asset.imageUrl);

  if (canShowImage) {
    return (
      <img
        src={asset.imageUrl}
        alt={alt}
        draggable={false}
        onError={() => onImageError(asset.imageUrl!)}
      />
    );
  }

  return (
    <div
      className="story-asset-placeholder"
      style={{ background: asset.placeholder.gradient }}
      role="img"
      aria-label={`${alt} 임시 이미지`}
    >
      <span>{asset.placeholder.label}</span>
      {asset.placeholder.subtitle && <small>{asset.placeholder.subtitle}</small>}
    </div>
  );
}

function DialogueText({
  text,
  playerName,
}: {
  text: string;
  playerName: string;
}) {
  if (!playerName || !text.includes(playerName)) {
    return text;
  }

  return text.split(playerName).flatMap((part, index, parts) => [
    part,
    ...(index < parts.length - 1
      ? [
          <strong className="story-player-name" key={`player-name-${index}`}>
            {playerName}
          </strong>,
        ]
      : []),
  ]);
}

export function StoryPlayer({
  sequence,
  onNavigate,
  onComplete,
  onStoryStarted,
  onStoryCompleted,
  onCheckpointReached,
  playerStatus,
  presentationMode = DEFAULT_STORY_PRESENTATION_MODE,
  onChoiceAction,
  playerName = "",
}: StoryPlayerProps) {
  const steps = useMemo(
    () => sequence.scenes.flatMap((scene) => scene.steps),
    [sequence],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [renderState, setRenderState] =
    useState<StoryRenderState>(() => createInitialRenderState(sequence));
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(new Set());
  const clickLockRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const runnerRef = useRef(new StoryStepRunner());
  const baseCampControllerRef = useRef<BaseCampStoryController>(null);
  const baseCampReadyRef = useRef(false);
  const startedRef = useRef(false);
  const choiceLockedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      onStoryStarted?.(sequence.id);
    }
  }, [onStoryStarted, sequence.id]);

  const waitForBaseCampController = (signal: AbortSignal) =>
    new Promise<BaseCampStoryController | null>((resolve) => {
      const startedAt = performance.now();
      const check = () => {
        if (signal.aborted) {
          resolve(null);
          return;
        }
        if (baseCampReadyRef.current && baseCampControllerRef.current) {
          resolve(baseCampControllerRef.current);
          return;
        }
        if (performance.now() - startedAt >= 3000) {
          if (import.meta.env.DEV) {
            console.warn("[StoryPlayer] BaseCamp camera controller was not ready.");
          }
          resolve(null);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });

  useEffect(() => {
    const imageUrls = collectImageUrls(sequence);
    const preloaders = imageUrls.map((url) => {
      const image = new Image();
      image.onload = () => undefined;
      image.onerror = () => {
        setFailedUrls((current) => {
          if (current.has(url)) {
            return current;
          }
          return new Set(current).add(url);
        });
      };
      image.src = url;
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [sequence]);

  useEffect(() => {
    const step = steps[stepIndex];

    if (!step) {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onStoryCompleted?.(sequence.id);
        if (onComplete) {
          onComplete();
        } else {
          onNavigate(sequence.onCompleteScreen);
        }
      }
      return;
    }

    const abortController = new AbortController();
    const isClickStep =
      step.type === "dialogue" || step.type === "narration" || step.type === "choice";

    clickLockRef.current = true;
    setIsTransitioning(true);

    void runnerRef.current
      .run(
        step,
        {
          updateState: setRenderState,
          changeScreen: (screen) => {
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              onNavigate(screen);
            }
          },
          showBaseCamp: async (mapId, signal) => {
            if (!getBaseCampMap(mapId)) {
              if (import.meta.env.DEV) {
                console.warn(`[StoryPlayer] Unknown BaseCamp mapId: ${mapId}`);
              }
              return;
            }
            baseCampReadyRef.current = false;
            setRenderState((state) => ({
              ...state,
              baseCampMapId: mapId,
            }));
            await waitForBaseCampController(signal);
          },
          focusBaseCamp: async (focusPointId, durationMs, signal) => {
            const controller = await waitForBaseCampController(signal);
            await controller?.focus(focusPointId, durationMs, signal);
          },
          highlightBaseCampTarget: async (targetId) => {
            await baseCampControllerRef.current?.highlight(targetId);
          },
          clearBaseCampHighlight: async () => {
            await baseCampControllerRef.current?.clearHighlight();
          },
          restoreBaseCampCamera: async (durationMs, signal) => {
            const controller = await waitForBaseCampController(signal);
            await controller?.restore(durationMs, signal);
          },
          checkpoint: (checkpointId) => onCheckpointReached?.(sequence.id, checkpointId),
          resolveText: (text) => text.replaceAll("(플레이어 이름)", playerName),
        },
        abortController.signal,
      )
      .then(() => {
        if (abortController.signal.aborted || hasNavigatedRef.current) {
          return;
        }

        if (isClickStep) {
          clickLockRef.current = false;
          setIsTransitioning(false);
          return;
        }

        setStepIndex((current) => current + 1);
      });

    return () => abortController.abort();
  }, [onCheckpointReached, onComplete, onNavigate, sequence.id, sequence.onCompleteScreen, stepIndex, steps]);

  const currentStep = steps[stepIndex];
  const canAdvance =
    !isTransitioning &&
    (currentStep?.type === "dialogue" || currentStep?.type === "narration");

  const choose = (option: StoryChoiceOption) => {
    if (option.actionId) onChoiceAction?.(option.actionId);
    if (choiceLockedRef.current || isTransitioning) return;
    choiceLockedRef.current = true;
    if (option.closeStory) {
      setStepIndex(steps.length);
      return;
    }
    const target = option.nextStepId ? steps.findIndex((step) => step.id === option.nextStepId) : stepIndex + 1;
    setStepIndex(target >= 0 ? target : stepIndex + 1);
    window.queueMicrotask(() => { choiceLockedRef.current = false; });
  };

  const advance = () => {
    if (!canAdvance || clickLockRef.current) {
      return;
    }

    clickLockRef.current = true;
    setIsTransitioning(true);
    setStepIndex((current) => current + 1);
  };

  const markImageFailed = (url: string) => {
    setFailedUrls((current) => {
      if (current.has(url)) {
        return current;
      }
      return new Set(current).add(url);
    });
  };

  const background = renderState.backgroundId
    ? sequence.backgrounds[renderState.backgroundId]
    : undefined;
  const activeActorId =
    renderState.dialogue?.kind === "dialogue"
      ? renderState.dialogue.activeActorId
      : undefined;
  const isNarration = renderState.dialogue?.kind === "narration";
  const isBaseCampOverlay = presentationMode === "baseCampOverlay";
  const showPlayerStatus = shouldShowStoryPlayerStatus(
    presentationMode,
    Boolean(playerStatus),
  );
  const dialogueActor =
    renderState.dialogue?.kind === "dialogue" && activeActorId
      ? sequence.actors[activeActorId]
      : undefined;
  const visiblePortraits =
    Object.keys(renderState.portraits).length > 0
      ? Object.values(renderState.portraits)
      : dialogueActor?.portraits.default
        ? [{
            actorId: dialogueActor.id,
            portraitId: "default",
            position: "left" as const,
            transition: "fade" as const,
            revision: 0,
          }]
        : [];
  const isAirshipScene = renderState.backgroundId === "airship";
  const isRuinsScene = renderState.backgroundId === "ruins";
  const backgroundLayers = background?.layers ?? [];
  const fixedAirshipSky = isAirshipScene
    ? backgroundLayers.find((layer) => layer.id === "sky")
    : undefined;
  const fixedRuinsBackground = isRuinsScene
    ? backgroundLayers.find((layer) => layer.id === "background")
    : undefined;
  const fixedBackgroundLayer = fixedAirshipSky ?? fixedRuinsBackground;
  const movingBackgroundLayers = fixedBackgroundLayer
    ? backgroundLayers.filter((layer) => layer.id !== fixedBackgroundLayer.id)
    : backgroundLayers;
  const dialogueFollowsWalk =
    currentStep?.type === "dialogue" && steps[stepIndex - 1]?.type === "npcWalk";
  const ruinsWorldDescendIndex = steps.findIndex(
    (step) => step.id === "scene2-world-descend",
  );
  const isRuinsWorldDescending =
    isRuinsScene &&
    ruinsWorldDescendIndex >= 0 &&
    stepIndex >= ruinsWorldDescendIndex;
  const isRuinsLeftFocus =
    isRuinsScene &&
    currentStep?.id.startsWith("scene2-camera-left") === true;
  const isRuinsRightFocus =
    isRuinsScene &&
    currentStep?.id.startsWith("scene2-camera-right") === true;
  const ruinsCameraFocusClass = isRuinsLeftFocus
    ? "is-ruins-focus-left"
    : isRuinsRightFocus
      ? "is-ruins-focus-right"
      : "";

  return (
    <main
      className={[
        "story-player",
        `story-player-${presentationMode}`,
        isAirshipScene ? "story-player-airship" : "",
        isRuinsScene ? "story-player-ruins" : "",
      ].filter(Boolean).join(" ")}
      aria-label={sequence.title}
      data-presentation-mode={presentationMode}
    >
      {fixedAirshipSky && (
        <div className="story-fixed-sky" aria-hidden="true">
          <img
            className="story-background-layer"
            src={fixedAirshipSky.imageUrl}
            alt=""
            draggable={false}
            onError={() => markImageFailed(fixedAirshipSky.imageUrl)}
          />
        </div>
      )}
      <div
        key={renderState.camera.shakeRevision}
        className={`story-camera ${renderState.camera.shakeDurationMs > 0 ? "is-shaking" : ""} ${ruinsCameraFocusClass}`}
        style={{
          transform: `translate(${renderState.camera.x}%, ${renderState.camera.y}%) scale(${renderState.camera.zoom})`,
          transitionDuration: `${renderState.camera.durationMs}ms`,
          "--story-shake-amplitude": `${renderState.camera.shakeAmplitude}px`,
          "--story-shake-duration": `${renderState.camera.shakeDurationMs}ms`,
        } as CSSProperties}
      >
      {fixedRuinsBackground && (
        <div className="story-ruins-background" aria-hidden="true">
          <img
            className="story-background-layer"
            src={fixedRuinsBackground.imageUrl}
            alt=""
            draggable={false}
            onError={() => markImageFailed(fixedRuinsBackground.imageUrl)}
          />
        </div>
      )}
      <div className={`story-moving-world ${isRuinsWorldDescending ? "is-descending" : ""}`}>
        {!isBaseCampOverlay && (
          <div
            key={renderState.backgroundRevision}
            className={`story-background story-transition-${renderState.backgroundTransition}`}
          >
            {movingBackgroundLayers.map((layer) => (
              <img
                key={layer.id}
                className="story-background-layer"
                src={layer.imageUrl}
                alt=""
                draggable={false}
                style={{ zIndex: layer.order }}
                onError={() => markImageFailed(layer.imageUrl)}
              />
            ))}
            {background && !background.layers?.length && (
              <StoryAsset
                asset={background}
                alt={background.placeholder.label}
                failedUrls={failedUrls}
                onImageError={markImageFailed}
              />
            )}
          </div>
        )}

        <StoryNpcRenderer npcs={renderState.storyNpcs} />
      </div>

      {renderState.baseCampMapId && (
        <BaseCampStoryAdapter
          ref={baseCampControllerRef}
          mapId={renderState.baseCampMapId}
          onReady={() => {
            baseCampReadyRef.current = true;
          }}
        />
      )}

      <div
        className="story-background-shade"
        aria-hidden="true"
      />
      </div>

      {renderState.illust.imageUrl && (
        <div
          className={`story-illust-overlay has-image ${renderState.illust.visible ? "is-visible" : ""}`}
          style={{
            "--story-illust-fade": `${renderState.illust.fadeMs}ms`,
          } as CSSProperties}
        >
          <img src={renderState.illust.imageUrl} alt="" draggable={false} />
        </div>
      )}

      <div className="story-portrait-layer" aria-live="polite">
        {visiblePortraits.map((portrait) => {
          const actor = sequence.actors[portrait.actorId];
          const asset = actor?.portraits[portrait.portraitId];
          const isDimmed = !isNarration && activeActorId !== portrait.actorId;

          if (!actor || !asset) {
            return null;
          }

          return (
            <div
              key={portrait.actorId}
              className={[
                "story-portrait",
                `story-portrait-${portrait.position}`,
                `story-transition-${portrait.transition}`,
                isDimmed ? "is-dimmed" : "is-active",
              ].join(" ")}
            >
              <StoryAsset
                asset={asset}
                alt={`${actor.name} ${portrait.portraitId}`}
                failedUrls={failedUrls}
                onImageError={markImageFailed}
              />
            </div>
          );
        })}
      </div>

      {renderState.dialogue && (
        <section
          className={`story-dialogue-box ${
            renderState.dialogue.kind === "narration" ? "is-narration" : ""
          } ${dialogueFollowsWalk ? "is-after-walk" : ""}`}
          aria-live="polite"
          style={
            dialogueActor
              ? ({ "--story-speaker-accent": dialogueActor.accentColor } as CSSProperties)
              : undefined
          }
        >
          {renderState.dialogue.kind === "dialogue" && (
            <p className="story-speaker-name">
              {renderState.dialogue.speakerName}
            </p>
          )}
          <p
            className={`story-dialogue-text ${
              renderState.dialogue.kind === "dialogue" &&
              renderState.dialogue.emphasis === "danger"
                ? "is-danger-emphasis"
                : ""
            }`}
          >
            <DialogueText
              text={renderState.dialogue.text}
              playerName={playerName}
            />
          </p>
          {currentStep?.type === "choice" ? (
            <StoryChoiceList options={currentStep.options} disabled={isTransitioning} onChoose={choose} />
          ) : <button
            type="button"
            className="story-next-button"
            disabled={!canAdvance}
            onClick={advance}
          >
            다음
          </button>}
          {showPlayerStatus && playerStatus && (
            <footer className="story-player-status">
              <PlayerStatusBar {...playerStatus} />
            </footer>
          )}
        </section>
      )}

      <div
        className={`story-fade-layer ${renderState.fade.visible ? "is-visible" : ""}`}
        style={{
          backgroundColor: renderState.fade.color,
          transitionDuration: `${renderState.fade.durationMs}ms`,
        }}
        aria-hidden="true"
      />
    </main>
  );
}
