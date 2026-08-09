import { INITIAL_INVENTORY_STATE, changeItemQuantity, getItemQuantity } from "../inventory/inventoryState";
import {
  ITEM_COLLECTION_QUEST_RULES,
  canCompleteItemCollectionQuest,
  clearCollectionQuestEventFlags,
  removeCollectionQuestItems,
  shouldRunItemCollectionQuestEvent,
} from "./itemCollectionQuestRules";

const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`[item collection quest checks] ${message}`);
};

export function runItemCollectionQuestRulesChecks() {
  const rule = ITEM_COLLECTION_QUEST_RULES[0];
  let inventory = changeItemQuantity(INITIAL_INVENTORY_STATE, "potion-small", -1);
  rule.itemIds.forEach((itemId) => { inventory = changeItemQuantity(inventory, itemId, 1); });
  check(!canCompleteItemCollectionQuest(inventory, [], rule), "items alone cannot complete the quest");
  check(canCompleteItemCollectionQuest(inventory, [rule.floorId], rule), "items plus floor clear can complete the quest");
  const firstRoomId = rule.roomByItemId[rule.itemIds[0]];
  const inventoryWithoutQuestItems = removeCollectionQuestItems(inventory, rule);
  check(
    shouldRunItemCollectionQuestEvent(inventoryWithoutQuestItems, "active", rule, firstRoomId),
    "missing item reactivates its event before quest completion",
  );
  check(
    !shouldRunItemCollectionQuestEvent(inventoryWithoutQuestItems, "completed", rule, firstRoomId),
    "completed quest permanently disables its collection events",
  );
  const cleaned = removeCollectionQuestItems(inventory, rule);
  check(rule.itemIds.every((itemId) => getItemQuantity(cleaned, itemId) === 0), "run items are removed");
  check(getItemQuantity(cleaned, "potion-small") === 1, "consumed potion stays consumed");
  const flags = clearCollectionQuestEventFlags(
    Object.fromEntries(Object.values(rule.eventByItemId).map((id) => [id, true])),
    rule,
  );
  check(Object.values(rule.eventByItemId).every((id) => !flags[id]), "event flags reset");
  console.info("item collection quest checks: PASS");
}
