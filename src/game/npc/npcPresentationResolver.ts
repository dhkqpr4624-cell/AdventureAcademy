import { NPC_BY_ID } from "./npcDefinitions";
import type { NpcId } from "./npcTypes";

export function resolveNpcPresentation(npcId: NpcId) {
  const npc = NPC_BY_ID[npcId];

  return {
    id: npc.id,
    displayName: npc.displayName,
    role: npc.role,
    portraits: npc.portraits,
    dialogue: npc.dialogue,
    offeredQuestIds: npc.offeredQuestIds,
  };
}
