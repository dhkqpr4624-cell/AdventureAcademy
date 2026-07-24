export const SCREEN_IDS = [
  "title",
  "story",
  "baseCamp",
  "dungeon",
  "question",
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];
