import {
  BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION,
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
  assert(
    !BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION.visibleBorder,
    "BaseCamp overlay portraits must not show a frame border",
  );
  assert(
    !BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION.opaqueBackground,
    "BaseCamp overlay portrait backgrounds must stay transparent",
  );
  assert(
    !BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION.boxShadow,
    "BaseCamp overlay portraits must not show a frame shadow",
  );
  assert(
    BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION.softEdgeMask,
    "BaseCamp overlay portraits must use a soft-edge mask",
  );
  assert(
    BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION.layoutDimensionsPreserved,
    "BaseCamp overlay portrait layout dimensions must be preserved",
  );
}
