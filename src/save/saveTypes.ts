import type { QuestStatus } from "../game/quest/questTypes";
import type { InventoryState } from "../game/inventory/inventoryState";
import type { DungeonFloorRunState } from "../game/dungeon/dungeonTypes";

export const CURRENT_SAVE_VERSION = 7 as const;

export type SaveReason =
  | "introCompleted" | "baseCampEntered" | "storyStarted"
  | "storyCheckpoint" | "storyCompleted" | "npcDialogueCompleted"
  | "questAccepted" | "floorUnlocked" | "dungeonEntered" | "floorCleared"
  | "questCompleted"
  | "itemAcquired" | "equipmentChanged"
  | "shopUsed"
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

export type SaveDataV2 = Omit<SaveDataV1, "version" | "player"> & {
  version: 2;
  player: { currentHp: number; maxHp: number; gold: number };
};

export type SaveDataV3 = Omit<SaveDataV2, "version" | "inventory"> & {
  version: 3;
  inventory: InventoryState;
};

export type SaveDataV4 = Omit<SaveDataV3, "version" | "player"> & {
  version: 4;
  player: SaveDataV3["player"] & { name: string };
  questProgress: {
    floorBestCorrect: Record<string, number>;
    firstObjectiveEventSeen: Record<string, boolean>;
    rewardClaimed: Record<string, boolean>;
  };
};

export type SaveDataV5 = Omit<SaveDataV4, "version" | "player"> & {
  version: 5;
  player: SaveDataV4["player"] & { defense: number };
};

export type SaveDataV6 = Omit<SaveDataV5, "version" | "player"> & {
  version: 6;
  player: Omit<SaveDataV5["player"], "defense">;
};

export type SaveDataV7 = Omit<SaveDataV6, "version" | "dungeon"> & {
  version: 7;
  dungeon: SaveDataV6["dungeon"] & {
    currentFloorRun: DungeonFloorRunState | null;
  };
};

export type CurrentSaveData = SaveDataV7;
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
