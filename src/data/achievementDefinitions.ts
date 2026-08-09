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
  "quest-floor-1-prehistory",
);
const floor2RareRewardCondition = getQuestRareRewardCondition(
  "quest-floor-2-memory-fragment",
);
const floor3RareRewardCondition = getQuestRareRewardCondition("quest-floor-3-torn-cloth");

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "achievement-floor-1-rare-reward",
    floorId: "floor-1",
    floorTitle: "던전 1층",
    title: "선사시대 유물 조사",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/hand-axe.png`,
    rewardItemId: "weapon-hand-axe",
    rewardStateId: "quest-floor-1-prehistory",
    requiredCorrect: floor1RareRewardCondition.requiredCorrect,
    totalQuestions: floor1RareRewardCondition.totalQuestions,
    description: "던전 1층 정답",
  },
  {
    id: "achievement-floor-2-rare-reward",
    floorId: "floor-2",
    floorTitle: "던전 2층",
    title: "청동기 유물 상자",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/bipa-bronze-sword.png`,
    rewardItemId: "weapon-gojoseon-bronze-dagger",
    rewardStateId: "quest-floor-2-memory-fragment",
    requiredCorrect: floor2RareRewardCondition.requiredCorrect,
    totalQuestions: floor2RareRewardCondition.totalQuestions,
    description: "던전 2층 정답",
  },
  {
    id: "achievement-floor-3-rare-reward", floorId: "floor-3", floorTitle: "던전 3층",
    title: "광개토대왕 갑옷", rewardIcon: `${import.meta.env.BASE_URL}assets/items/gwanggaeto-armor.png`,
    rewardItemId: "armor-gwanggaeto", rewardStateId: "quest-floor-3-torn-cloth",
    requiredCorrect: floor3RareRewardCondition.requiredCorrect,
    totalQuestions: floor3RareRewardCondition.totalQuestions,
    description: "던전 3층 정답",
  },
];
