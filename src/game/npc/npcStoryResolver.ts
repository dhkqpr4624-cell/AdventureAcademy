import type { QuestState } from "../quest/questTypes";
import { resolveNpcPresentation } from "./npcPresentationResolver";
import type { NpcId } from "./npcTypes";

export function resolveNpcStorySequence(
  npcId: NpcId,
  questStatuses: QuestState,
) {
  const npc = resolveNpcPresentation(npcId);
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
