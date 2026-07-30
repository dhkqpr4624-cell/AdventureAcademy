import { INITIAL_PLAYER_STATE } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import { validateCurrentSave } from "./saveSchema";
import type { CurrentSaveData, ImportResult, SaveDataV1, SaveDataV2, SaveDataV3, SaveDataV4, SaveDataV5, SaveDataV6 } from "./saveTypes";
import { calculatePlayerMaxHp, INITIAL_INVENTORY_STATE, type InventoryState } from "../game/inventory/inventoryState";

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
  floorBestCorrect: {}, firstObjectiveEventSeen: {}, rewardClaimed: {}, achievementReceived: {},
});

function migrateV0ToV6(raw: LegacySaveDataV0): SaveDataV6 {
  const hp = typeof raw.hp === "number" ? Math.max(0, Math.min(raw.hp, INITIAL_PLAYER_STATE.maxHp)) : INITIAL_PLAYER_STATE.currentHp;
  const statuses = { ...INITIAL_QUEST_STATE };
  if (raw.activeQuestId && raw.activeQuestId in statuses) statuses[raw.activeQuestId] = "active";
  return {
    version: 6, savedAt: new Date().toISOString(), playTimeSeconds: 0,
    player: { ...INITIAL_PLAYER_STATE, name: "", currentHp: hp },
    quests: { statuses, activeQuestId: raw.activeQuestId ?? null },
    floors: { unlockedFloorIds: Array.isArray(raw.unlockedFloors) ? raw.unlockedFloors : [] },
    story: { completedStoryIds: [], checkpointByStoryId: {}, executedActionIds: Array.isArray(raw.executedActionIds) ? raw.executedActionIds : [] },
    dungeon: { currentFloorId: null, clearedFloorIds: [] },
    inventory: initialInventory(),
    questProgress: emptyQuestProgress(),
  };
}

function migrateV1ToV6(raw: SaveDataV1): SaveDataV6 {
  return {
    ...raw,
    version: 6,
    player: {
      name: "",
      currentHp: raw.player.currentHp,
      maxHp: raw.player.maxHp,
      gold: 0,
    },
    inventory: initialInventory(),
    questProgress: emptyQuestProgress(),
  };
}

function migrateV2ToV6(raw: SaveDataV2): SaveDataV6 {
  return { ...raw, version: 6, player: { ...raw.player, name: "" }, inventory: initialInventory(), questProgress: emptyQuestProgress() };
}

function migrateV3ToV6(raw: SaveDataV3): SaveDataV6 {
  const maxHp = calculatePlayerMaxHp(raw.inventory);
  return { ...raw, version: 6, player: { ...raw.player, name: "", maxHp, currentHp: Math.min(raw.player.currentHp, maxHp) }, questProgress: emptyQuestProgress() };
}

function migrateV4ToV6(raw: SaveDataV4): SaveDataV6 {
  const inventory: InventoryState = {
    items: { ...raw.inventory.items },
    equippedItemIds: {
      weaponSkin: raw.inventory.equippedItemIds.weaponSkin ?? null,
      armor: raw.inventory.equippedItemIds.armor ?? null,
    },
  };
  return {
    ...raw,
    version: 6,
    player: {
      ...raw.player,
      maxHp: calculatePlayerMaxHp(inventory),
      currentHp: Math.min(raw.player.currentHp, calculatePlayerMaxHp(inventory)),
    },
    inventory,
  };
}

function migrateV5ToV6(raw: SaveDataV5): SaveDataV6 {
  const inventory: InventoryState = {
    items: { ...raw.inventory.items },
    equippedItemIds: {
      weaponSkin: raw.inventory.equippedItemIds.weaponSkin ?? null,
      armor: raw.inventory.equippedItemIds.armor ?? null,
    },
  };
  const maxHp = calculatePlayerMaxHp(inventory);
  const { defense: _legacyDefense, ...player } = raw.player;
  return {
    ...raw,
    version: 6,
    player: { ...player, maxHp, currentHp: Math.min(player.currentHp, maxHp) },
    inventory,
  };
}

function migrateV6ToV7(raw: SaveDataV6): CurrentSaveData {
  return {
    ...raw,
    version: 7,
    questProgress: {
      ...raw.questProgress,
      achievementReceived: {},
    },
    dungeon: {
      ...raw.dungeon,
      currentFloorRun: null,
    },
  };
}

export function migrateSaveData(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { success: false, reason: "invalidSchema" };
  const version = (raw as { version?: unknown }).version;
  if (typeof version === "number" && version > 7) return { success: false, reason: "unsupportedVersion" };
  try {
    const migratedFromVersion =
      version === undefined || version === 0 ? 0 : version === 1 ? 1 : version === 2 ? 2 : version === 3 ? 3 : version === 4 ? 4 : version === 5 ? 5 : version === 6 ? 6 : undefined;
    const v6Candidate =
      migratedFromVersion === 0
        ? migrateV0ToV6(raw as LegacySaveDataV0)
        : migratedFromVersion === 1
          ? migrateV1ToV6(raw as SaveDataV1)
          : migratedFromVersion === 2
            ? migrateV2ToV6(raw as SaveDataV2)
            : migratedFromVersion === 3
              ? migrateV3ToV6(raw as SaveDataV3)
              : migratedFromVersion === 4
                ? migrateV4ToV6(raw as SaveDataV4)
                : migratedFromVersion === 5
                  ? migrateV5ToV6(raw as SaveDataV5)
                  : migratedFromVersion === 6
                    ? raw as SaveDataV6
                    : null;
    const candidate = v6Candidate
      ? migrateV6ToV7(v6Candidate)
      : raw;
    const data = validateCurrentSave(candidate);
    return data ? { success: true, data, ...(migratedFromVersion !== undefined ? { migratedFromVersion } : {}) } : { success: false, reason: "invalidSchema" };
  } catch {
    return { success: false, reason: "migrationFailed" };
  }
}
