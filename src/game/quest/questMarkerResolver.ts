import type { NpcDefinition } from "../npc/npcTypes";
import type { QuestMarkerStatus } from "./questTypes";

export type QuestMarkerType = "available" | "readyToComplete" | "none";

export function resolveNpcQuestMarker(
  npc: Pick<NpcDefinition, "offeredQuestIds">,
  questStatuses: Readonly<Record<string, QuestMarkerStatus | undefined>>,
): QuestMarkerType {
  const offeredStatuses = npc.offeredQuestIds.map(
    (questId) => questStatuses[questId],
  );

  if (offeredStatuses.includes("readyToComplete")) {
    return "readyToComplete";
  }
  if (offeredStatuses.includes("available")) {
    return "available";
  }
  return "none";
}
