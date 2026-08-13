import type { QuestDefinition, QuestState } from "./questTypes";

export const QUEST_DEFINITIONS: readonly QuestDefinition[] = [
  {
    id: "quest-floor-1-prehistory",
    title: "던전의 정체",
    summary: "던전 1층을 조사하자.",
    description:
      "던전 1층을 살펴보고 이 던전의 정체를 파악할 수 있는 물건들을 가져온다.",
    objectiveText: "선사시대 유물 3개 수집",
    giverNpcId: "kaiden",
    offerStorySequenceId: "npc-kaiden-quest-available",
    acceptStorySequenceId: "npc-kaiden-quest-accepted",
    activeStorySequenceId: "npc-kaiden-quest-active",
    targetFloorId: "floor-1",
    completeStorySequenceId: "npc-kaiden-quest-complete",
    rewards: { description: "5 Gold · 주먹도끼 무기 스킨(희귀)" },
  },
  {
    id: "quest-floor-2-memory-fragment",
    title: "기억 조각 회수",
    summary: "던전 2층을 조사하자.",
    description:
      "시간의 흐름이 뒤틀린 던전 2층을 조사하고 흩어진 기억의 단서를 확인한다.",
    objectiveText: "던전 2층 조사",
    giverNpcId: "kaiden",
    offerStorySequenceId: "npc-kaiden-floor-2-quest-available",
    acceptStorySequenceId: "npc-kaiden-floor-2-quest-accepted",
    activeStorySequenceId: "npc-kaiden-floor-2-quest-active",
    targetFloorId: "floor-2",
    completeStorySequenceId: "npc-kaiden-floor-2-quest-complete",
    rewards: { description: "5 Gold · 고조선 비파형 동검 스킨(희귀)" },
  },
  {
    id: "quest-floor-3-torn-cloth",
    title: "던전 3층 조사",
    summary: "던전 3층에서 느껴지는 기운을 조사하자.",
    description: "루나가 감지한 수상한 기운을 따라 던전 3층을 조사하고 단서를 가져온다.",
    objectiveText: "던전 3층 조사",
    giverNpcId: "luna",
    offerStorySequenceId: "npc-luna-floor-3-quest-available",
    acceptStorySequenceId: "npc-luna-floor-3-quest-accepted",
    activeStorySequenceId: "npc-luna-floor-3-quest-active",
    targetFloorId: "floor-3",
    completeStorySequenceId: "npc-luna-floor-3-quest-complete",
    rewards: { description: "5 Gold · 광개토대왕 갑옷(희귀)" },
  },
  {
    id: "quest-floor-4-jeon-rescue",
    title: "수상한 것의 정체",
    summary: "던전 4층 너머의 수상한 것을 찾자.",
    description: "던전 3층의 천 조각과 닮은 기운을 따라 던전 4층 너머를 조사한다.",
    objectiveText: "던전 4층 너머의 수상한 것 찾기",
    giverNpcId: "luna",
    offerStorySequenceId: "npc-luna-floor-4-quest-available",
    acceptStorySequenceId: "npc-luna-floor-4-quest-accepted",
    activeStorySequenceId: "npc-luna-floor-4-quest-active",
    targetFloorId: "floor-4",
    completeStorySequenceId: "npc-luna-floor-4-quest-complete",
    rewards: { description: "5 Gold · 칠지도 무기 스킨(희귀)" },
  },
];

export const INITIAL_QUEST_STATE: QuestState = Object.fromEntries(
  QUEST_DEFINITIONS.map((quest, index) => [
    quest.id,
    index === 0 ? "available" : "locked",
  ]),
);
