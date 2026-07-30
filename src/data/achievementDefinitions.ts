import { getQuestRareRewardCondition } from "../game/quest/questRareRewardConditions";

export type AchievementDefinition = {
  id: string;
  floorId: string;
  floorTitle: string;
  title: string;
  rewardIcon: string;
  rewardItemId: string;
  rewardStateId: string;
  requiredCorrect: number;
  totalQuestions: number;
  description: string;
};

const floor1RareRewardCondition = getQuestRareRewardCondition(
  "quest-floor-1-memory-fragment",
);

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "achievement-floor-1-rare-reward",
    floorId: "floor-1",
    floorTitle: "던전 1층",
    title: "청동기 유물 상자",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/bipa-bronze-sword.png`,
    rewardItemId: "weapon-gojoseon-bronze-dagger",
    rewardStateId: "quest-floor-1-memory-fragment",
    requiredCorrect: floor1RareRewardCondition.requiredCorrect,
    totalQuestions: floor1RareRewardCondition.totalQuestions,
    description: "던전 1층 정답",
  },
];
