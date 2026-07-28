import type { NpcId } from "../npc/npcTypes";

export type QuestStatus = "locked" | "available" | "active" | "completed";

export type QuestDefinition = {
  id: string;
  title: string;
  summary: string;
  description: string;
  objectiveText: string;
  giverNpcId: NpcId;
  offerStorySequenceId: string;
  acceptStorySequenceId?: string;
  activeStorySequenceId?: string;
  completeStorySequenceId?: string;
  targetFloorId?: string;
  rewards: { description: string };
};

export type QuestState = Record<string, QuestStatus>;

export type AcceptQuestResult = {
  success: boolean;
  nextState: QuestState;
  reason?: "questNotFound" | "questNotAvailable" | "alreadyActive";
};
