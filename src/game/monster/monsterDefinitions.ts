import floor1EliteImage from "../../assets/dungeon/monsters/floor1_elite.png";
import floor1BoarImage from "../../assets/dungeon/monsters/floor1-boar.png";
import floor1CaveBearImage from "../../assets/dungeon/monsters/floor1-cave-bear.png";
import floor1MammothImage from "../../assets/dungeon/monsters/floor1-mammoth.png";

export type MonsterVisualDefinition = {
  id: string;
  name: string;
  image: string;
  displayScale: number;
  aspectRatio: number;
  anchor: [number, number, number];
};

export const MONSTER_VISUAL_DEFINITIONS: Readonly<
  Record<string, MonsterVisualDefinition>
> = {
  "garlic-king": {
    id: "garlic-king",
    name: "마늘킹",
    image: `${import.meta.env.BASE_URL}assets/monsters/test-monster.png`,
    displayScale: 1,
    aspectRatio: 812 / 778,
    anchor: [0, 0, 0],
  },
  "floor1-elite": {
    id: "floor1-elite",
    name: "고인돌 골렘",
    image: floor1EliteImage,
    displayScale: 1.16,
    aspectRatio: 812 / 778,
    anchor: [0, -0.03, 0],
  },
  "floor1-boar": { id: "floor1-boar", name: "멧돼지", image: floor1BoarImage, displayScale: 1.08, aspectRatio: 3 / 2, anchor: [0, -0.03, 0] },
  "floor1-cave-bear": { id: "floor1-cave-bear", name: "동굴곰", image: floor1CaveBearImage, displayScale: 1.1, aspectRatio: 3 / 2, anchor: [0, -0.03, 0] },
  "floor1-mammoth": { id: "floor1-mammoth", name: "매머드", image: floor1MammothImage, displayScale: 1.2, aspectRatio: 3 / 2, anchor: [0, -0.04, 0] },
};

export function getMonsterVisualDefinition(
  monsterId: string,
): MonsterVisualDefinition {
  const definition = MONSTER_VISUAL_DEFINITIONS[monsterId];
  if (!definition) {
    throw new Error(`[monsterDefinitions] Unknown monster: ${monsterId}`);
  }
  return definition;
}
