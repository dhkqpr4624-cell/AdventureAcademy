import type { QuestStatus } from "../game/quest/questTypes";

export const CURRENT_SAVE_VERSION = 1 as const;

export type SaveReason =
  | "introCompleted" | "baseCampEntered" | "storyStarted"
  | "storyCheckpoint" | "storyCompleted" | "npcDialogueCompleted"
  | "questAccepted" | "floorUnlocked" | "dungeonEntered" | "floorCleared"
  | "itemAcquired" | "equipmentChanged" | "levelUp"
  | "interval" | "visibilityHidden" | "pageHide" | "manual" | "imported";

export type SaveDataV1 = {
  version: 1;
  savedAt: string;
  playTimeSeconds: number;
  player: { level: number; currentHp: number; maxHp: number };
  quests: { statuses: Record<string, QuestStatus>; activeQuestId: string | null };
  floors: { unlockedFloorIds: string[] };
  story: {
    completedStoryIds: string[];
    checkpointByStoryId: Record<string, string>;
    executedActionIds: string[];
  };
  dungeon: { currentFloorId: string | null; clearedFloorIds: string[] };
  inventory: {
    items: Record<string, number>;
    equippedItemIds: Record<string, string | null>;
  };
};

export type CurrentSaveData = SaveDataV1;
export type SaveSource = "main" | "backup-1" | "backup-2" | "backup-3";
export type SaveResult =
  | { success: true; savedAt: string; skipped?: boolean }
  | { success: false; reason: "serializationFailed" | "storageUnavailable" | "quotaExceeded" | "unknown"; error?: unknown };
export type LoadResult =
  | { success: true; data: CurrentSaveData; source: SaveSource; migratedFromVersion?: number }
  | { success: false; reason: "notFound" | "invalidJson" | "invalidSchema" | "unsupportedVersion" | "migrationFailed" | "allBackupsInvalid" };
export type ImportResult =
  | { success: true; data: CurrentSaveData; migratedFromVersion?: number }
  | { success: false; reason: Exclude<LoadResult, { success: true }>["reason"] };

