import type {
  StoryRenderState,
  StoryStep,
  StoryTransition,
} from "../../types/story";

export const DEFAULT_STORY_STEP_DURATION_MS = 180;

export type StoryStepContext = {
  updateState: (updater: (state: StoryRenderState) => StoryRenderState) => void;
  changeScreen: (screen: Extract<StoryStep, { type: "changeScreen" }>["screen"]) => void;
  showBaseCamp: (mapId: string, signal: AbortSignal) => Promise<void>;
  focusBaseCamp: (
    focusPointId: string,
    durationMs: number,
    signal: AbortSignal,
  ) => Promise<void>;
  highlightBaseCampTarget: (targetId: string) => Promise<void>;
  clearBaseCampHighlight: () => Promise<void>;
  restoreBaseCampCamera: (
    durationMs: number,
    signal: AbortSignal,
  ) => Promise<void>;
  checkpoint: (checkpointId: string) => void;
  resolveText: (text: string) => string;
};

function waitFor(durationMs: number, signal: AbortSignal) {
  if (durationMs <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(resolve, durationMs);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        resolve();
      },
      { once: true },
    );
  });
}

function resolveDuration(step: StoryStep) {
  if (
    step.type === "wait" ||
    step.type === "fade" ||
    step.type === "cameraPan" ||
    step.type === "cameraZoom" ||
    step.type === "shake"
  ) {
    return step.durationMs;
  }

  if (
    step.type === "setBackground" ||
    step.type === "showPortrait" ||
    step.type === "changePortrait" ||
    step.type === "hidePortrait"
  ) {
    return step.durationMs ?? DEFAULT_STORY_STEP_DURATION_MS;
  }

  return 0;
}

function normalizeTransition(transition?: StoryTransition): StoryTransition {
  return transition ?? "none";
}

export class StoryStepRunner {
  async run(step: StoryStep, context: StoryStepContext, signal: AbortSignal) {
    if (signal.aborted) {
      return;
    }

    switch (step.type) {
      case "setBackground":
        context.updateState((state) => ({
          ...state,
          backgroundId: step.backgroundId,
          backgroundTransition: normalizeTransition(step.transition),
          backgroundRevision: state.backgroundRevision + 1,
        }));
        break;
      case "showPortrait":
        context.updateState((state) => ({
          ...state,
          portraits: {
            ...state.portraits,
            [step.actorId]: {
              actorId: step.actorId,
              portraitId: step.portraitId,
              position: step.position,
              transition: normalizeTransition(step.transition),
              revision: (state.portraits[step.actorId]?.revision ?? 0) + 1,
            },
          },
        }));
        break;
      case "changePortrait":
        context.updateState((state) => {
          const current = state.portraits[step.actorId];

          if (!current) {
            return state;
          }

          return {
            ...state,
            portraits: {
              ...state.portraits,
              [step.actorId]: {
                ...current,
                portraitId: step.portraitId,
                transition: "fade",
                revision: current.revision + 1,
              },
            },
          };
        });
        break;
      case "hidePortrait":
        context.updateState((state) => {
          const portraits = { ...state.portraits };
          delete portraits[step.actorId];
          return { ...state, portraits };
        });
        break;
      case "dialogue":
        context.updateState((state) => ({
          ...state,
          dialogue: {
            kind: "dialogue",
            speakerName: context.resolveText(step.speakerName),
            text: context.resolveText(step.text),
            activeActorId: step.activeActorId,
            emphasis: step.emphasis,
          },
        }));
        break;
      case "narration":
        context.updateState((state) => ({
          ...state,
          dialogue: { kind: "narration", text: context.resolveText(step.text) },
        }));
        break;
      case "choice":
        break;
      case "checkpoint":
        context.checkpoint(step.checkpointId);
        return;
      case "fade":
        context.updateState((state) => ({
          ...state,
          fade: {
            visible: step.direction === "out",
            color: step.color ?? "#000000",
            durationMs: step.durationMs,
          },
        }));
        break;
      case "cameraPan":
        context.updateState((state) => ({
          ...state,
          camera: {
            ...state.camera,
            x: step.x,
            y: step.y,
            zoom: step.zoom ?? state.camera.zoom,
            durationMs: step.durationMs,
          },
        }));
        break;
      case "cameraZoom":
        context.updateState((state) => ({
          ...state,
          camera: { ...state.camera, zoom: step.zoom, durationMs: step.durationMs },
        }));
        break;
      case "shake":
        context.updateState((state) => ({
          ...state,
          camera: {
            ...state.camera,
            shakeDurationMs: step.durationMs,
            shakeAmplitude: step.amplitude,
            shakeRevision: state.camera.shakeRevision + 1,
          },
        }));
        break;
      case "npcWalk":
        context.updateState((state) => ({
          ...state,
          dialogue: null,
          storyNpcs: {
            ...state.storyNpcs,
            [step.actorId]: {
              actorId: step.actorId,
              pose: "Walking",
              facing: step.facing,
              x: step.fromX ?? state.storyNpcs[step.actorId]?.x ?? step.toX,
              y: step.y ?? state.storyNpcs[step.actorId]?.y ?? 0,
              durationMs: 0,
            },
          },
        }));
        await waitFor(16, signal);
        context.updateState((state) => ({
          ...state,
          storyNpcs: {
            ...state.storyNpcs,
            [step.actorId]: {
              ...state.storyNpcs[step.actorId],
              x: step.toX,
              durationMs: step.durationMs,
            },
          },
        }));
        await waitFor(step.durationMs, signal);
        if (!signal.aborted) {
          context.updateState((state) => ({
            ...state,
            storyNpcs: {
              ...state.storyNpcs,
              [step.actorId]: {
                ...state.storyNpcs[step.actorId],
                pose: "Standing",
                facing: step.facing,
                durationMs: 0,
              },
            },
          }));
        }
        return;
      case "npcPose":
        context.updateState((state) => {
          const current = state.storyNpcs[step.actorId];
          return {
            ...state,
            storyNpcs: {
              ...state.storyNpcs,
              [step.actorId]: {
                actorId: step.actorId,
                pose: step.pose,
                facing: step.facing ?? current?.facing ?? "Right",
                x: step.x ?? current?.x ?? 50,
                y: step.y ?? current?.y ?? 0,
                durationMs: 0,
              },
            },
          };
        });
        break;
      case "illustOverlay":
        context.updateState((state) => ({
          ...state,
          illust: {
            imageUrl: step.imageUrl ?? state.illust.imageUrl,
            visible: step.visible,
            fadeMs: step.fadeMs ?? 250,
          },
        }));
        break;
      case "showBaseCamp":
        await context.showBaseCamp(step.mapId, signal);
        return;
      case "focusBaseCamp":
        await context.focusBaseCamp(
          step.focusPointId,
          step.durationMs,
          signal,
        );
        return;
      case "highlightBaseCampTarget":
        await context.highlightBaseCampTarget(step.targetId);
        return;
      case "clearBaseCampHighlight":
        await context.clearBaseCampHighlight();
        return;
      case "restoreBaseCampCamera":
        await context.restoreBaseCampCamera(step.durationMs, signal);
        return;
      case "changeScreen":
        context.changeScreen(step.screen);
        return;
      case "wait":
        break;
    }

    await waitFor(resolveDuration(step), signal);
  }
}
