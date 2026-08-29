export type QuestRareRewardCondition = {
  questId: string;
  floorId: string;
  requiredCorrect: number;
  totalQuestions: number;
};

export const QUEST_RARE_REWARD_CONDITIONS: Record<
  string,
  QuestRareRewardCondition
> = {
  "quest-floor-1-prehistory": {
    questId: "quest-floor-1-prehistory",
    floorId: "floor-1",
    requiredCorrect: 8,
    totalQuestions: 10,
  },
  "quest-floor-2-memory-fragment": {
    questId: "quest-floor-2-memory-fragment",
    floorId: "floor-2",
    requiredCorrect: 6,
    totalQuestions: 10,
  },
  "quest-floor-3-torn-cloth": {
    questId: "quest-floor-3-torn-cloth",
    floorId: "floor-3",
    requiredCorrect: 6,
    totalQuestions: 10,
  },
  "quest-floor-4-jeon-rescue": {
    questId: "quest-floor-4-jeon-rescue",
    floorId: "floor-4",
    requiredCorrect: 9,
    totalQuestions: 10,
  },
  "quest-floor-5-unified-silla": { questId: "quest-floor-5-unified-silla", floorId: "floor-5", requiredCorrect: 9, totalQuestions: 10 },
  "quest-floor-6-balhae": { questId: "quest-floor-6-balhae", floorId: "floor-6", requiredCorrect: 9, totalQuestions: 10 },
  "quest-floor-7-goryeo-founding": { questId: "quest-floor-7-goryeo-founding", floorId: "floor-7", requiredCorrect: 9, totalQuestions: 10 },
  "quest-floor-8-goryeo-relations": { questId: "quest-floor-8-goryeo-relations", floorId: "floor-8", requiredCorrect: 9, totalQuestions: 10 },
  "quest-floor-9-goryeo-society-culture": { questId: "quest-floor-9-goryeo-society-culture", floorId: "floor-9", requiredCorrect: 9, totalQuestions: 10 },
};

export function getQuestRareRewardCondition(
  questId: string,
): QuestRareRewardCondition {
  const condition = QUEST_RARE_REWARD_CONDITIONS[questId];
  if (!condition) {
    throw new Error(`Unknown quest rare reward condition: ${questId}`);
  }
  return condition;
}
