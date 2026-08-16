import { changeItemQuantity, type InventoryState } from "../inventory/inventoryState";
import type { QuestState } from "./questTypes";

export const QUEST_ITEM_IDS_BY_QUEST: Readonly<Record<string, readonly string[]>> = {
  "quest-floor-1-prehistory": [
    "quest-hand-axe",
    "quest-tanged-point",
    "quest-comb-pattern-pottery",
  ],
  "quest-floor-2-memory-fragment": ["quest-memory-fragment"],
  "quest-floor-3-torn-cloth": ["quest-torn-cloth"],
  "quest-floor-4-jeon-rescue": ["quest-jeon-rescue-marker"],
  "quest-floor-5-unified-silla": [],
  "quest-floor-6-balhae": [],
};

const NEXT_QUEST_ID: Readonly<Record<string, string>> = {
  "quest-floor-1-prehistory": "quest-floor-2-memory-fragment",
  "quest-floor-2-memory-fragment": "quest-floor-3-torn-cloth",
  "quest-floor-3-torn-cloth": "quest-floor-4-jeon-rescue",
  "quest-floor-4-jeon-rescue": "quest-floor-5-unified-silla",
  "quest-floor-5-unified-silla": "quest-floor-6-balhae",
};

export function completeQuestStateAfterRewardClaim(
  state: QuestState,
  questId: string,
): QuestState {
  const nextQuestId = NEXT_QUEST_ID[questId];
  return {
    ...state,
    [questId]: "completed",
    ...(nextQuestId && state[nextQuestId] !== "completed"
      ? { [nextQuestId]: "available" as const }
      : {}),
  };
}

export function removeQuestItemsAfterRewardClaim(
  inventory: InventoryState,
  questId: string,
): InventoryState {
  return (QUEST_ITEM_IDS_BY_QUEST[questId] ?? []).reduce(
    (current, itemId) => changeItemQuantity(current, itemId, -1),
    inventory,
  );
}

export function resolveQuestRewardDecision({
  questState,
  inventory,
  questId,
  action,
}: {
  questState: QuestState;
  inventory: InventoryState;
  questId: string;
  action: "claim" | "cancel";
}) {
  if (action === "cancel") {
    return { questState, inventory, completed: false } as const;
  }
  return {
    questState: completeQuestStateAfterRewardClaim(questState, questId),
    inventory: removeQuestItemsAfterRewardClaim(inventory, questId),
    completed: true,
  } as const;
}

export function resolveQuestRewardGrant(
  bestCorrect: number,
  requiredCorrect: number,
) {
  return {
    gold: 5,
    rareUnlocked: bestCorrect >= requiredCorrect,
  } as const;
}
