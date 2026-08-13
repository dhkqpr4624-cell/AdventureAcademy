import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { getItemQuantity, type InventoryState } from "./game/inventory/inventoryState";
import { resolveNpcStorySequence } from "./game/npc/npcStoryResolver";
import { resolveQuestRewardDecision, resolveQuestRewardGrant } from "./game/quest/questRewardCompletionResolver";
import type { QuestState } from "./game/quest/questTypes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[phase29_9Checks] ${message}`);
}

export function runPhase29_9Checks(): void {
  const activeState: QuestState = {
    "quest-floor-1-prehistory": "completed",
    "quest-floor-2-memory-fragment": "completed",
    "quest-floor-3-torn-cloth": "active",
    "quest-floor-4-jeon-rescue": "locked",
  };
  const inventory: InventoryState = {
    items: { "quest-torn-cloth": 1 },
    equippedItemIds: { weaponSkin: "weapon-basic-sword", armor: null },
  };

  const canceled = resolveQuestRewardDecision({
    questState: activeState,
    inventory,
    questId: "quest-floor-3-torn-cloth",
    action: "cancel",
  });
  assert(!canceled.completed, "cancel must not complete quest");
  assert(canceled.questState["quest-floor-3-torn-cloth"] === "active", "cancel must keep current quest active");
  assert(canceled.questState["quest-floor-4-jeon-rescue"] === "locked", "cancel must keep next quest locked");
  assert(getItemQuantity(canceled.inventory, "quest-torn-cloth") === 1, "cancel must keep quest item");
  assert(resolveNpcStorySequence("luna", canceled.questState) === "npc-luna-floor-3-quest-active", "cancel must allow active quest dialogue");

  const claimed = resolveQuestRewardDecision({
    questState: activeState,
    inventory,
    questId: "quest-floor-3-torn-cloth",
    action: "claim",
  });
  assert(claimed.completed, "claim must complete quest");
  assert(claimed.questState["quest-floor-3-torn-cloth"] === "completed", "claim must mark quest completed");
  assert(claimed.questState["quest-floor-4-jeon-rescue"] === "available", "claim must open Dungeon 4 quest");
  assert(getItemQuantity(claimed.inventory, "quest-torn-cloth") === 0, "claim must remove torn cloth");
  assert(resolveNpcStorySequence("luna", claimed.questState) === "npc-luna-floor-4-quest-available", "claim must advance Luna dialogue");

  const dungeon4Inventory: InventoryState = {
    ...inventory,
    items: { "quest-jeon-rescue-marker": 1 },
  };
  const dungeon4Claimed = resolveQuestRewardDecision({
    questState: { ...claimed.questState, "quest-floor-4-jeon-rescue": "active" },
    inventory: dungeon4Inventory,
    questId: "quest-floor-4-jeon-rescue",
    action: "claim",
  });
  assert(getItemQuantity(dungeon4Claimed.inventory, "quest-jeon-rescue-marker") === 0, "Dungeon 4 quest marker must be removed");

  const baseOnly = resolveQuestRewardGrant(7, 8);
  assert(baseOnly.gold === 5 && !baseOnly.rareUnlocked, "claim must always grant 5 Gold without an ineligible rare reward");
  const rareReward = resolveQuestRewardGrant(8, 8);
  assert(rareReward.gold === 5 && rareReward.rareUnlocked, "eligible claim must grant both base and rare rewards");

  for (const sequenceId of [
    "npc-luna-floor-4-quest-available",
    "npc-luna-floor-4-quest-accepted",
    "npc-luna-floor-4-quest-active",
    "npc-luna-floor-4-quest-complete",
  ]) {
    const sequence = NPC_STORY_SEQUENCES[sequenceId];
    assert(sequence, `${sequenceId} missing`);
    const dialogueSteps = sequence.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue");
    assert(dialogueSteps.every((step) => !step.text.includes("\n")), `${sequenceId} contains forced line break`);
  }

  const completionSteps = NPC_STORY_SEQUENCES["npc-luna-floor-4-quest-complete"].scenes[0].steps;
  let visiblePortraits = new Set<string>();
  for (const step of completionSteps) {
    if (step.type === "hidePortrait") visiblePortraits.delete(step.actorId);
    if (step.type === "showPortrait") visiblePortraits.add(step.actorId);
    if (step.type === "dialogue") {
      assert(visiblePortraits.size === 1, `${step.id} must show exactly one portrait`);
      assert(visiblePortraits.has(step.speakerId ?? ""), `${step.id} must show the current speaker`);
    }
  }
}
