export type StoryPresentationMode = "fullscreen" | "baseCampOverlay";

export const DEFAULT_STORY_PRESENTATION_MODE: StoryPresentationMode =
  "fullscreen";

export function shouldShowStoryPlayerStatus(
  presentationMode: StoryPresentationMode,
  hasPlayerStatus: boolean,
) {
  return presentationMode === "fullscreen" && hasPlayerStatus;
}
