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
    completeStorySequenceId: "npc-kaiden-quest-complete",
    rewards: { description: "5 Gold · 고조선 비파형 동검 스킨(희귀)" },
  },
  {
    id: "quest-floor-2-torn-cloth",
    title: "던전 2층 조사",
    summary: "던전 2층에서 느껴지는 기운을 조사하자.",
    description:
      "루나가 감지한 수상한 기운을 따라 던전 2층을 조사하고 단서를 가져온다.",
    objectiveText: "던전 2층 조사",
    giverNpcId: "luna",
    offerStorySequenceId: "npc-luna-floor-2-quest-available",
    acceptStorySequenceId: "npc-luna-floor-2-quest-accepted",
    activeStorySequenceId: "npc-luna-floor-2-quest-active",
    targetFloorId: "floor-2",
    completeStorySequenceId: "npc-luna-floor-2-quest-complete",
    rewards: { description: "5 Gold · 광개토대왕 갑옷(희귀)" },
  },
];

export const INITIAL_QUEST_STATE: QuestState = Object.fromEntries(
  QUEST_DEFINITIONS.map((quest, index) => [
    quest.id,
    index === 0 ? "available" : "locked",
  ]),
);
