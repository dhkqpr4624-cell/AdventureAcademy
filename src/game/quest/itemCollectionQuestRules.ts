import type { FloorId } from "../floor/floorTypes";
import {
  changeItemQuantity,
  getItemQuantity,
  type InventoryState,
} from "../inventory/inventoryState";
import type { QuestStatus } from "./questTypes";

export type ItemCollectionQuestRule = {
  questId: string;
  floorId: FloorId;
  itemIds: readonly string[];
  roomByItemId: Readonly<Record<string, string>>;
  eventByItemId: Readonly<Record<string, string>>;
};

export const ITEM_COLLECTION_QUEST_RULES: readonly ItemCollectionQuestRule[] = [
  {
    questId: "quest-floor-1-prehistory",
    floorId: "floor-1",
    itemIds: ["quest-hand-axe", "quest-tanged-point", "quest-comb-pattern-pottery"],
    roomByItemId: {
      "quest-hand-axe": "room-story-hand-axe",
      "quest-tanged-point": "room-story-tanged-point",
      "quest-comb-pattern-pottery": "room-story-pottery",
    },
    eventByItemId: {
      "quest-hand-axe": "floor-1:hand-axe",
      "quest-tanged-point": "floor-1:tanged-point",
      "quest-comb-pattern-pottery": "floor-1:comb-pattern-pottery",
    },
  },
] as const;

export function getItemCollectionQuestRuleForFloor(floorId: FloorId) {
  return ITEM_COLLECTION_QUEST_RULES.find((rule) => rule.floorId === floorId) ?? null;
}

export function hasAllCollectionItems(inventory: InventoryState, rule: ItemCollectionQuestRule): boolean {
  return rule.itemIds.every((itemId) => getItemQuantity(inventory, itemId) > 0);
}

export function shouldRunItemCollectionQuestEvent(
  inventory: InventoryState,
  questStatus: QuestStatus,
  rule: ItemCollectionQuestRule,
  roomId: string,
): boolean {
  if (questStatus === "completed") return false;
  const itemId = Object.entries(rule.roomByItemId).find(([, eventRoomId]) => eventRoomId === roomId)?.[0];
  return Boolean(itemId && getItemQuantity(inventory, itemId) === 0);
}

export function canCompleteItemCollectionQuest(
  inventory: InventoryState,
  clearedFloorIds: readonly string[],
  rule: ItemCollectionQuestRule,
): boolean {
  return clearedFloorIds.includes(rule.floorId) && hasAllCollectionItems(inventory, rule);
}

export function removeCollectionQuestItems(
  inventory: InventoryState,
  rule: ItemCollectionQuestRule,
): InventoryState {
  return rule.itemIds.reduce((next, itemId) => {
    const quantity = getItemQuantity(next, itemId);
    return quantity > 0 ? changeItemQuantity(next, itemId, -quantity) : next;
  }, inventory);
}

export function clearCollectionQuestEventFlags(
  flags: Record<string, boolean>,
  rule: ItemCollectionQuestRule,
): Record<string, boolean> {
  const next = { ...flags };
  Object.values(rule.eventByItemId).forEach((eventId) => delete next[eventId]);
  return next;
}
