import type { IntroSceneSequence, StorySequence } from "../../types/story";

const emptyScene = (id: string, title: string): StorySequence => ({
  id,
  title,
  scenes: [{ id: `${id}-scene`, steps: [{ id: `${id}-wait`, type: "wait", durationMs: 1, advanceMode: "auto" }] }],
  backgrounds: {},
  actors: {},
  replayable: true,
  skippable: true,
  onCompleteScreen: "story",
});

export const INTRO_SCENE_SEQUENCE: IntroSceneSequence = {
  id: "intro-phase24",
  scenes: [
    { id: "Scene0", mode: "introText", lines: ["……"] },
    { id: "Scene1", mode: "story", sequence: emptyScene("intro-scene-1", "Scene1") },
    { id: "Scene2", mode: "story", sequence: emptyScene("intro-scene-2", "Scene2") },
  ],
  onCompleteScreen: "baseCamp",
};
