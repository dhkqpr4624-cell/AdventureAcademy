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
const floor4RareRewardCondition = getQuestRareRewardCondition("quest-floor-4-jeon-rescue");
const floor5RareRewardCondition = getQuestRareRewardCondition("quest-floor-5-unified-silla");
const floor6RareRewardCondition = getQuestRareRewardCondition("quest-floor-6-balhae");
const floor7RareRewardCondition = getQuestRareRewardCondition("quest-floor-7-goryeo-founding");
const floor8RareRewardCondition = getQuestRareRewardCondition("quest-floor-8-goryeo-relations");

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
  {
    id: "achievement-floor-4-rare-reward",
    floorId: "floor-4",
    floorTitle: "던전 4층",
    title: "가야의 감옥 조사",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/chiljido.png`,
    rewardItemId: "weapon-chiljido",
    rewardStateId: "quest-floor-4-jeon-rescue",
    requiredCorrect: floor4RareRewardCondition.requiredCorrect,
    totalQuestions: floor4RareRewardCondition.totalQuestions,
    description: "던전 4층 정답",
  },
  {
    id: "achievement-floor-5-rare-reward", floorId: "floor-5", floorTitle: "던전 5층",
    title: "삼국 통일의 과정", rewardIcon: `${import.meta.env.BASE_URL}assets/items/munmu-armor.png`,
    rewardItemId: "armor-munmu", rewardStateId: "quest-floor-5-unified-silla",
    requiredCorrect: floor5RareRewardCondition.requiredCorrect, totalQuestions: floor5RareRewardCondition.totalQuestions,
    description: "던전 5층 정답",
  },
  {
    id: "achievement-floor-6-rare-reward", floorId: "floor-6", floorTitle: "던전 6층",
    title: "발해 유민의 정체", rewardIcon: `${import.meta.env.BASE_URL}assets/items/silla-ring-pommel-sword.png`,
    rewardItemId: "weapon-silla-ring-pommel-sword", rewardStateId: "quest-floor-6-balhae",
    requiredCorrect: floor6RareRewardCondition.requiredCorrect, totalQuestions: floor6RareRewardCondition.totalQuestions,
    description: "던전 6층 정답",
  },
  {
    id: "achievement-floor-7-rare-reward", floorId: "floor-7", floorTitle: "던전 7층",
    title: "고려의 기둥", rewardIcon: `${import.meta.env.BASE_URL}assets/items/gungye-eyepatch.png`,
    rewardItemId: "accessory-gungye-eyepatch", rewardStateId: "quest-floor-7-goryeo-founding",
    requiredCorrect: floor7RareRewardCondition.requiredCorrect, totalQuestions: floor7RareRewardCondition.totalQuestions,
    description: "던전 7층 정답",
  },
  {
    id: "achievement-floor-8-rare-reward", floorId: "floor-8", floorTitle: "던전 8층",
    title: "고려와 주변 국가의 관계", rewardIcon: `${import.meta.env.BASE_URL}assets/items/choe-museon-cannon.png`,
    rewardItemId: "weapon-choe-museon-cannon", rewardStateId: "quest-floor-8-goryeo-relations",
    requiredCorrect: floor8RareRewardCondition.requiredCorrect, totalQuestions: floor8RareRewardCondition.totalQuestions,
    description: "던전 8층 정답",
  },
];
