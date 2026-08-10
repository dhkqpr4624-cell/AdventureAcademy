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
  );
  const status = offeredQuestId ? questStatuses[offeredQuestId] : undefined;
  const quest = offeredQuestId
    ? QUEST_DEFINITIONS.find((candidate) => candidate.id === offeredQuestId)
    : undefined;
  if (status === "available" && quest?.offerStorySequenceId) return quest.offerStorySequenceId;
  if (status === "active" && quest?.activeStorySequenceId) return quest.activeStorySequenceId;
  if (status === "available" && npc.dialogue.questAvailableStorySequenceId) {
    return npc.dialogue.questAvailableStorySequenceId;
  }
  if (status === "active" && npc.dialogue.questActiveStorySequenceId) {
    return npc.dialogue.questActiveStorySequenceId;
  }
  return npc.dialogue.defaultStorySequenceId;
}
