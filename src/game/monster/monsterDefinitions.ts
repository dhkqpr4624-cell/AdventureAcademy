import floor1EliteImage from "../../assets/dungeon/monsters/floor1_elite.png";

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
