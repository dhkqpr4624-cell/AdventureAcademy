export type StoryPresentationMode = "fullscreen" | "baseCampOverlay";

export const DEFAULT_STORY_PRESENTATION_MODE: StoryPresentationMode =
  "fullscreen";

export const BASE_CAMP_OVERLAY_PORTRAIT_PRESENTATION = {
  visibleBorder: false,
  opaqueBackground: false,
  boxShadow: false,
  softEdgeMask: true,
  layoutDimensionsPreserved: true,
} as const;

export function shouldShowStoryPlayerStatus(
  presentationMode: StoryPresentationMode,
  hasPlayerStatus: boolean,
) {
  return presentationMode === "fullscreen" && hasPlayerStatus;
}
