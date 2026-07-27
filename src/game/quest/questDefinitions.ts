import type { QuestDefinition, QuestState } from "./questTypes";

export const QUEST_DEFINITIONS: readonly QuestDefinition[] = [
  {
    id: "quest-floor-1-memory-fragment",
    title: "기억 조각 회수",
    summary: "던전 1층을 조사하자.",
    description:
      "시간의 흐름이 뒤틀린 던전 1층을 조사하고 흩어진 기억의 단서를 확인한다.",
    objectiveText: "던전 1층 조사",
    giverNpcId: "kaiden",
    offerStorySequenceId: "npc-kaiden-quest-available",
    acceptStorySequenceId: "npc-kaiden-quest-accepted",
    activeStorySequenceId: "npc-kaiden-quest-active",
    targetFloorId: "floor-1",
    rewards: { description: "추후 지급" },
  },
];

export const INITIAL_QUEST_STATE: QuestState = Object.fromEntries(
  QUEST_DEFINITIONS.map((quest) => [quest.id, "available"]),
);

