import { useEffect, useMemo, useRef, useState } from "react";
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

type StoryPlayerProps = {
  sequence: StorySequence;
  onNavigate: (screen: ScreenId) => void;
};

const INITIAL_RENDER_STATE: StoryRenderState = {
  backgroundId: null,
  backgroundTransition: "none",
  backgroundRevision: 0,
  portraits: {},
  dialogue: null,
  baseCampMapId: null,
  fade: { visible: false, color: "#000000", durationMs: 0 },
};

function collectImageUrls(sequence: StorySequence) {
  const assets: StoryVisualAsset[] = [
    ...Object.values(sequence.backgrounds),
    ...Object.values(sequence.actors).flatMap((actor) =>
      Object.values(actor.portraits),
    ),
  ];

  return [...new Set(assets.flatMap((asset) => (asset.imageUrl ? [asset.imageUrl] : [])))];
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

export function StoryPlayer({ sequence, onNavigate }: StoryPlayerProps) {
  const steps = useMemo(
    () => sequence.scenes.flatMap((scene) => scene.steps),
    [sequence],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [renderState, setRenderState] =
    useState<StoryRenderState>(INITIAL_RENDER_STATE);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(new Set());
  const clickLockRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const runnerRef = useRef(new StoryStepRunner());
  const baseCampControllerRef = useRef<BaseCampStoryController>(null);
  const baseCampReadyRef = useRef(false);

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
        onNavigate(sequence.onCompleteScreen);
      }
      return;
    }

    const abortController = new AbortController();
    const isClickStep =
      step.type === "dialogue" || step.type === "narration";

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
  }, [onNavigate, sequence.onCompleteScreen, stepIndex, steps]);

  const currentStep = steps[stepIndex];
  const canAdvance =
    !isTransitioning &&
    (currentStep?.type === "dialogue" || currentStep?.type === "narration");

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

  return (
    <main className="story-player" aria-label={sequence.title}>
      <div
        key={renderState.backgroundRevision}
        className={`story-background story-transition-${renderState.backgroundTransition}`}
      >
        {background && (
          <StoryAsset
            asset={background}
            alt={background.placeholder.label}
            failedUrls={failedUrls}
            onImageError={markImageFailed}
          />
        )}
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

      <div className="story-background-shade" aria-hidden="true" />

      <div className="story-portrait-layer" aria-live="polite">
        {Object.values(renderState.portraits).map((portrait) => {
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
              <div className="story-portrait-caption">
                <strong>{actor.name}</strong>
                <span>{actor.role}</span>
                <small>{asset.placeholder.subtitle ?? portrait.portraitId}</small>
              </div>
            </div>
          );
        })}
      </div>

      {renderState.dialogue && (
        <section
          className={`story-dialogue-box ${
            renderState.dialogue.kind === "narration" ? "is-narration" : ""
          }`}
          aria-live="polite"
        >
          {renderState.dialogue.kind === "dialogue" && (
            <p className="story-speaker-name">
              {renderState.dialogue.speakerName}
            </p>
          )}
          <p className="story-dialogue-text">{renderState.dialogue.text}</p>
          <button
            type="button"
            className="story-next-button"
            disabled={!canAdvance}
            onClick={advance}
          >
            다음
          </button>
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
