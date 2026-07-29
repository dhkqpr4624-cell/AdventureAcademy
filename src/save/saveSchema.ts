import { QUEST_DEFINITIONS } from "../game/quest/questDefinitions";
import type { QuestStatus } from "../game/quest/questTypes";
import { CURRENT_SAVE_VERSION, type CurrentSaveData } from "./saveTypes";
import { ITEM_DEFINITION_REGISTRY } from "../game/inventory/itemDefinitions";

const STATUSES = new Set<QuestStatus>(["locked", "available", "active", "completed"]);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const unique = (items: string[]) => [...new Set(items)];

export function validateCurrentSave(value: unknown): CurrentSaveData | null {
  if (!isObject(value) || value.version !== CURRENT_SAVE_VERSION ||
      typeof value.savedAt !== "string" || !Number.isFinite(value.playTimeSeconds) ||
      !isObject(value.player) || !isObject(value.quests) || !isObject(value.floors) ||
      !isObject(value.story) || !isObject(value.dungeon) || !isObject(value.inventory)) return null;
  const player = value.player;
  if (!Number.isFinite(player.currentHp) || !Number.isFinite(player.maxHp) ||
      !Number.isFinite(player.gold) || (player.gold as number) < 0 ||
      typeof player.name !== "string" ||
      (player.maxHp as number) <= 0 ||
      (player.currentHp as number) < 0 || (player.currentHp as number) > (player.maxHp as number)) return null;
  if (!isObject(value.quests.statuses) || !strings(value.floors.unlockedFloorIds) ||
      !strings(value.story.completedStoryIds) || !isObject(value.story.checkpointByStoryId) ||
      !strings(value.story.executedActionIds) || !strings(value.dungeon.clearedFloorIds)) return null;
  if (!isObject(value.inventory.items) || !isObject(value.inventory.equippedItemIds) ||
      !isObject(value.questProgress) || !isObject(value.questProgress.floorBestCorrect) ||
      !isObject(value.questProgress.firstObjectiveEventSeen) || !isObject(value.questProgress.rewardClaimed)) return null;
  const items: Record<string, number> = {};
  for (const [itemId, quantity] of Object.entries(value.inventory.items)) {
    if (!ITEM_DEFINITION_REGISTRY[itemId] || !Number.isFinite(quantity) || (quantity as number) < 0) return null;
    const normalized = Math.floor(quantity as number);
    if (normalized > 0) items[itemId] = normalized;
  }
  const equippedItemIds: Record<"weaponSkin" | "armor", string | null> = {
    weaponSkin: null,
    armor: null,
  };
  for (const [slot, itemId] of Object.entries(value.inventory.equippedItemIds)) {
    if (slot !== "weaponSkin" && slot !== "armor") continue;
    if (itemId !== null && (typeof itemId !== "string" || !ITEM_DEFINITION_REGISTRY[itemId])) return null;
    const definition = itemId ? ITEM_DEFINITION_REGISTRY[itemId] : null;
    if (definition && definition.type !== slot) return null;
    equippedItemIds[slot] = itemId as string | null;
  }
  const statuses: Record<string, QuestStatus> = {};
  for (const quest of QUEST_DEFINITIONS) {
    const status = value.quests.statuses[quest.id];
    if (!STATUSES.has(status as QuestStatus)) return null;
    statuses[quest.id] = status as QuestStatus;
  }
  const activeQuestId = value.quests.activeQuestId;
  if (activeQuestId !== null && typeof activeQuestId !== "string") return null;
  const checkpointByStoryId: Record<string, string> = {};
  for (const [id, checkpoint] of Object.entries(value.story.checkpointByStoryId)) {
    if (typeof checkpoint !== "string") return null;
    checkpointByStoryId[id] = checkpoint;
  }
  return {
    version: CURRENT_SAVE_VERSION,
    savedAt: value.savedAt,
    playTimeSeconds: Math.max(0, Math.floor(value.playTimeSeconds as number)),
    player: {
      name: (player.name as string).trim().slice(0, 12),
      currentHp: player.currentHp as number,
      maxHp: player.maxHp as number,
      gold: Math.floor(player.gold as number),
    },
    quests: { statuses, activeQuestId: activeQuestId as string | null },
    floors: { unlockedFloorIds: unique(value.floors.unlockedFloorIds as string[]) },
    story: {
      completedStoryIds: unique(value.story.completedStoryIds as string[]),
      checkpointByStoryId,
      executedActionIds: unique(value.story.executedActionIds as string[]),
    },
    dungeon: {
      currentFloorId: value.dungeon.currentFloorId === null || typeof value.dungeon.currentFloorId === "string" ? value.dungeon.currentFloorId as string | null : null,
      clearedFloorIds: unique(value.dungeon.clearedFloorIds as string[]),
    },
    inventory: { items, equippedItemIds },
    questProgress: {
      floorBestCorrect: Object.fromEntries(Object.entries(value.questProgress.floorBestCorrect).filter(([, count]) => Number.isFinite(count) && (count as number) >= 0).map(([id, count]) => [id, Math.floor(count as number)])),
      firstObjectiveEventSeen: Object.fromEntries(Object.entries(value.questProgress.firstObjectiveEventSeen).filter(([, seen]) => typeof seen === "boolean")) as Record<string, boolean>,
      rewardClaimed: Object.fromEntries(Object.entries(value.questProgress.rewardClaimed).filter(([, claimed]) => typeof claimed === "boolean")) as Record<string, boolean>,
    },
  };
}
