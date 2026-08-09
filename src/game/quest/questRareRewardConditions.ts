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
    totalQuestions: 8,
  },
  "quest-floor-3-torn-cloth": {
    questId: "quest-floor-3-torn-cloth",
    floorId: "floor-3",
    requiredCorrect: 6,
    totalQuestions: 8,
  },
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
