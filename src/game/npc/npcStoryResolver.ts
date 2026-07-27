import type { NpcDefinition } from "./npcTypes";
import type { QuestState } from "../quest/questTypes";

export function resolveNpcStorySequence(
  npc: NpcDefinition,
  questStatuses: QuestState,
) {
  const offeredQuestId = npc.offeredQuestIds[0];
  const status = offeredQuestId ? questStatuses[offeredQuestId] : undefined;
  if (status === "available" && npc.dialogue.questAvailableStorySequenceId) {
    return npc.dialogue.questAvailableStorySequenceId;
  }
  if (status === "active" && npc.dialogue.questActiveStorySequenceId) {
    return npc.dialogue.questActiveStorySequenceId;
  }
  if (status === "completed" && npc.dialogue.questCompletedStorySequenceId) {
    return npc.dialogue.questCompletedStorySequenceId;
  }
  return npc.dialogue.defaultStorySequenceId;
}

