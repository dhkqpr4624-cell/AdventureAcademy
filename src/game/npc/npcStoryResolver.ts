import type { QuestState } from "../quest/questTypes";
import { resolveNpcPresentation } from "./npcPresentationResolver";
import type { NpcId } from "./npcTypes";
import { QUEST_DEFINITIONS } from "../quest/questDefinitions";

export function resolveNpcStorySequence(
  npcId: NpcId,
  questStatuses: QuestState,
) {
  const npc = resolveNpcPresentation(npcId);
  const offeredQuestId = npc.offeredQuestIds.find((id) =>
    questStatuses[id] === "available" || questStatuses[id] === "active"
  ) ?? npc.offeredQuestIds.find((id) => questStatuses[id] === "completed");
  const status = offeredQuestId ? questStatuses[offeredQuestId] : undefined;
  const quest = offeredQuestId
    ? QUEST_DEFINITIONS.find((candidate) => candidate.id === offeredQuestId)
    : undefined;
  if (status === "available" && quest?.offerStorySequenceId) return quest.offerStorySequenceId;
  if (status === "active" && quest?.activeStorySequenceId) return quest.activeStorySequenceId;
  if (status === "completed" && quest?.completeStorySequenceId) return quest.completeStorySequenceId;
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
