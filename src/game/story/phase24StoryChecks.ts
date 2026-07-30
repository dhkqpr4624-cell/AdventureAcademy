import type { StoryRenderState, StoryStep } from "../../types/story";
import { INTRO_SCENE_SEQUENCE } from "../../data/stories/introScenes";
import { StoryStepRunner, type StoryStepContext } from "./StoryStepRunner";
import {
  STORY_NPC_ASSETS,
  STORY_NPC_FRAME_HEIGHT,
  STORY_NPC_FRAME_WIDTH,
  STORY_NPC_WALK_FPS,
} from "./storyNpcRegistry";

const initialState = (): StoryRenderState => ({
  backgroundId: null,
  backgroundTransition: "none",
  backgroundRevision: 0,
  portraits: {},
  dialogue: null,
  baseCampMapId: null,
  fade: { visible: false, color: "#000", durationMs: 0 },
  camera: {
    x: 0, y: 0, zoom: 1, durationMs: 0,
    shakeDurationMs: 0, shakeAmplitude: 0, shakeRevision: 0,
  },
  storyNpcs: {},
  illust: { imageUrl: null, visible: false, fadeMs: 0 },
});

export async function runPhase24StoryChecks() {
  let state = initialState();
  const context: StoryStepContext = {
    updateState: (update) => { state = update(state); },
    changeScreen: () => undefined,
    showBaseCamp: async () => undefined,
    focusBaseCamp: async () => undefined,
    highlightBaseCampTarget: async () => undefined,
    clearBaseCampHighlight: async () => undefined,
    restoreBaseCampCamera: async () => undefined,
    checkpoint: () => undefined,
    resolveText: (text) => text.replaceAll("(플레이어 이름)", "모험가"),
  };
  const run = (step: StoryStep) => new StoryStepRunner().run(step, context, new AbortController().signal);

  await run({ id: "pose", type: "npcPose", actorId: "theo", pose: "Standing", facing: "Left", x: 10, advanceMode: "auto" });
  await run({ id: "walk", type: "npcWalk", actorId: "theo", fromX: 10, toX: 20, facing: "Left", durationMs: 1, advanceMode: "auto" });
  if (state.storyNpcs.theo.pose !== "Standing" || state.storyNpcs.theo.facing !== "Left") {
    throw new Error("NPC walk must return to Standing while preserving Facing.");
  }
  await run({ id: "fall", type: "npcPose", actorId: "theo", pose: "FallDown", advanceMode: "auto" });
  const fallPose: string = state.storyNpcs.theo.pose;
  const fallFacing: string = state.storyNpcs.theo.facing;
  if (fallPose !== "FallDown" || fallFacing !== "Left") {
    throw new Error("FallDown must preserve Facing when no new facing is supplied.");
  }
  await run({ id: "pan", type: "cameraPan", x: 12, y: -4, durationMs: 0, advanceMode: "auto" });
  await run({ id: "zoom", type: "cameraZoom", zoom: 1.4, durationMs: 0, advanceMode: "auto" });
  await run({ id: "shake", type: "shake", amplitude: 7, durationMs: 0, advanceMode: "auto" });
  await run({ id: "fade", type: "fade", direction: "out", durationMs: 0, advanceMode: "auto" });
  await run({ id: "illust", type: "illustOverlay", imageUrl: "/illust.png", visible: true, fadeMs: 1, advanceMode: "auto" });
  await run({ id: "name", type: "dialogue", speakerName: "테오", text: "(플레이어 이름), 괜찮으십니까?", advanceMode: "click" });
  if (state.camera.x !== 12 || state.camera.zoom !== 1.4 || state.camera.shakeAmplitude !== 7) throw new Error("Camera step state mismatch.");
  if (!state.fade.visible || !state.illust.visible) throw new Error("Fade/illust state mismatch.");
  if (state.dialogue?.kind !== "dialogue" || !state.dialogue.text.includes("모험가")) throw new Error("Player name replacement failed.");
  if (INTRO_SCENE_SEQUENCE.scenes.map((scene) => scene.id).join(",") !== "Scene0,Scene1,Scene2") throw new Error("Intro scene order mismatch.");
  if (STORY_NPC_FRAME_WIDTH !== 380 || STORY_NPC_FRAME_HEIGHT !== 600 || STORY_NPC_WALK_FPS !== 5) throw new Error("Story NPC frame settings mismatch.");
  for (const actor of ["theo", "kaiden", "luna"]) {
    for (const facing of ["Left", "Right"] as const) {
      for (const pose of ["Standing", "Walking", "FallDown"] as const) {
        if (!STORY_NPC_ASSETS[actor]?.[facing]?.[pose]) throw new Error(`Missing story NPC asset: ${actor}/${facing}/${pose}`);
      }
    }
  }
}
