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
  "quest-floor-1-memory-fragment": {
    questId: "quest-floor-1-memory-fragment",
    floorId: "floor-1",
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
