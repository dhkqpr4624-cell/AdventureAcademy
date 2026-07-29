import { INITIAL_PLAYER_STATE } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import { validateCurrentSave } from "./saveSchema";
import type { CurrentSaveData, ImportResult, SaveDataV1, SaveDataV2, SaveDataV3, SaveDataV4 } from "./saveTypes";
import { calculateEquippedDefense, INITIAL_INVENTORY_STATE, type InventoryState } from "../game/inventory/inventoryState";

type LegacySaveDataV0 = {
  playerLevel?: number; hp?: number; activeQuestId?: string;
  unlockedFloors?: string[]; executedActionIds?: string[];
};

function initialInventory() {
  return {
    items: { ...INITIAL_INVENTORY_STATE.items },
    equippedItemIds: { ...INITIAL_INVENTORY_STATE.equippedItemIds },
  };
}

const emptyQuestProgress = () => ({
  floorBestCorrect: {}, firstObjectiveEventSeen: {}, rewardClaimed: {},
});

function migrateV0ToV5(raw: LegacySaveDataV0): CurrentSaveData {
  const hp = typeof raw.hp === "number" ? Math.max(0, Math.min(raw.hp, INITIAL_PLAYER_STATE.maxHp)) : INITIAL_PLAYER_STATE.currentHp;
  const statuses = { ...INITIAL_QUEST_STATE };
  if (raw.activeQuestId && raw.activeQuestId in statuses) statuses[raw.activeQuestId] = "active";
  return {
    version: 5, savedAt: new Date().toISOString(), playTimeSeconds: 0,
    player: { ...INITIAL_PLAYER_STATE, name: "", currentHp: hp },
    quests: { statuses, activeQuestId: raw.activeQuestId ?? null },
    floors: { unlockedFloorIds: Array.isArray(raw.unlockedFloors) ? raw.unlockedFloors : [] },
    story: { completedStoryIds: [], checkpointByStoryId: {}, executedActionIds: Array.isArray(raw.executedActionIds) ? raw.executedActionIds : [] },
    dungeon: { currentFloorId: null, clearedFloorIds: [] },
    inventory: initialInventory(),
    questProgress: emptyQuestProgress(),
  };
}

function migrateV1ToV5(raw: SaveDataV1): CurrentSaveData {
  return {
    ...raw,
    version: 5,
    player: {
      name: "",
      currentHp: raw.player.currentHp,
      maxHp: raw.player.maxHp,
      gold: 0,
      defense: 0,
    },
    inventory: initialInventory(),
    questProgress: emptyQuestProgress(),
  };
}

function migrateV2ToV5(raw: SaveDataV2): CurrentSaveData {
  return { ...raw, version: 5, player: { ...raw.player, name: "", defense: 0 }, inventory: initialInventory(), questProgress: emptyQuestProgress() };
}

function migrateV3ToV5(raw: SaveDataV3): CurrentSaveData {
  return { ...raw, version: 5, player: { ...raw.player, name: "", defense: calculateEquippedDefense(raw.inventory) }, questProgress: emptyQuestProgress() };
}

function migrateV4ToV5(raw: SaveDataV4): CurrentSaveData {
  const inventory: InventoryState = {
    items: { ...raw.inventory.items },
    equippedItemIds: {
      weaponSkin: raw.inventory.equippedItemIds.weaponSkin ?? null,
      armor: raw.inventory.equippedItemIds.armor ?? null,
    },
  };
  return {
    ...raw,
    version: 5,
    player: { ...raw.player, defense: calculateEquippedDefense(inventory) },
    inventory,
  };
}

export function migrateSaveData(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { success: false, reason: "invalidSchema" };
  const version = (raw as { version?: unknown }).version;
  if (typeof version === "number" && version > 5) return { success: false, reason: "unsupportedVersion" };
  try {
    const migratedFromVersion =
      version === undefined || version === 0 ? 0 : version === 1 ? 1 : version === 2 ? 2 : version === 3 ? 3 : version === 4 ? 4 : undefined;
    const candidate =
      migratedFromVersion === 0
        ? migrateV0ToV5(raw as LegacySaveDataV0)
        : migratedFromVersion === 1
          ? migrateV1ToV5(raw as SaveDataV1)
          : migratedFromVersion === 2
            ? migrateV2ToV5(raw as SaveDataV2)
            : migratedFromVersion === 3
              ? migrateV3ToV5(raw as SaveDataV3)
              : migratedFromVersion === 4
                ? migrateV4ToV5(raw as SaveDataV4)
            : raw;
    const data = validateCurrentSave(candidate);
    return data ? { success: true, data, ...(migratedFromVersion !== undefined ? { migratedFromVersion } : {}) } : { success: false, reason: "invalidSchema" };
  } catch {
    return { success: false, reason: "migrationFailed" };
  }
}
