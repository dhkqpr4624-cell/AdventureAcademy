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
  if (step.type === "wait" || step.type === "fade") {
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
            speakerName: step.speakerName,
            text: step.text,
            activeActorId: step.activeActorId,
          },
        }));
        break;
      case "narration":
        context.updateState((state) => ({
          ...state,
          dialogue: { kind: "narration", text: step.text },
        }));
        break;
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
