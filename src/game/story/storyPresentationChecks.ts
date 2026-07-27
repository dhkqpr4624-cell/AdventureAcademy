import {
  DEFAULT_STORY_PRESENTATION_MODE,
  shouldShowStoryPlayerStatus,
  type StoryPresentationMode,
} from "./storyPresentationTypes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[story presentation checks] ${message}`);
}

export function runStoryPresentationChecks() {
  const npcPresentation: StoryPresentationMode = "baseCampOverlay";
  const cinematicPresentation: StoryPresentationMode =
    DEFAULT_STORY_PRESENTATION_MODE;

  assert(
    npcPresentation === "baseCampOverlay",
    "NPC dialogue must use the BaseCamp overlay presentation",
  );
  assert(
    cinematicPresentation === "fullscreen",
    "cinematic stories must default to fullscreen",
  );
  assert(
    !shouldShowStoryPlayerStatus("baseCampOverlay", true),
    "NPC overlay dialogue must hide player status",
  );
  assert(
    shouldShowStoryPlayerStatus("fullscreen", true),
    "fullscreen dungeon/story dialogue must preserve player status",
  );
  assert(
    !shouldShowStoryPlayerStatus("fullscreen", false),
    "status cannot render without player data",
  );
}
