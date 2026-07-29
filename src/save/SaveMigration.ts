import { INITIAL_PLAYER_STATE } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import { validateCurrentSave } from "./saveSchema";
import type { CurrentSaveData, ImportResult, SaveDataV1 } from "./saveTypes";

type LegacySaveDataV0 = {
  playerLevel?: number; hp?: number; activeQuestId?: string;
  unlockedFloors?: string[]; executedActionIds?: string[];
};

function migrateV0ToV2(raw: LegacySaveDataV0): CurrentSaveData {
  const hp = typeof raw.hp === "number" ? Math.max(0, Math.min(raw.hp, INITIAL_PLAYER_STATE.maxHp)) : INITIAL_PLAYER_STATE.currentHp;
  const statuses = { ...INITIAL_QUEST_STATE };
  if (raw.activeQuestId && raw.activeQuestId in statuses) statuses[raw.activeQuestId] = "active";
  return {
    version: 2, savedAt: new Date().toISOString(), playTimeSeconds: 0,
    player: { ...INITIAL_PLAYER_STATE, currentHp: hp },
    quests: { statuses, activeQuestId: raw.activeQuestId ?? null },
    floors: { unlockedFloorIds: Array.isArray(raw.unlockedFloors) ? raw.unlockedFloors : [] },
    story: { completedStoryIds: [], checkpointByStoryId: {}, executedActionIds: Array.isArray(raw.executedActionIds) ? raw.executedActionIds : [] },
    dungeon: { currentFloorId: null, clearedFloorIds: [] },
    inventory: { items: {}, equippedItemIds: {} },
  };
}

function migrateV1ToV2(raw: SaveDataV1): CurrentSaveData {
  return {
    ...raw,
    version: 2,
    player: {
      currentHp: raw.player.currentHp,
      maxHp: raw.player.maxHp,
      gold: 0,
    },
  };
}

export function migrateSaveData(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { success: false, reason: "invalidSchema" };
  const version = (raw as { version?: unknown }).version;
  if (typeof version === "number" && version > 2) return { success: false, reason: "unsupportedVersion" };
  try {
    const migratedFromVersion =
      version === undefined || version === 0 ? 0 : version === 1 ? 1 : undefined;
    const candidate =
      migratedFromVersion === 0
        ? migrateV0ToV2(raw as LegacySaveDataV0)
        : migratedFromVersion === 1
          ? migrateV1ToV2(raw as SaveDataV1)
          : raw;
    const data = validateCurrentSave(candidate);
    return data ? { success: true, data, ...(migratedFromVersion !== undefined ? { migratedFromVersion } : {}) } : { success: false, reason: "invalidSchema" };
  } catch {
    return { success: false, reason: "migrationFailed" };
  }
}
