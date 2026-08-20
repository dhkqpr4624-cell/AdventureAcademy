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
  "baekje-smile": {
    id: "baekje-smile",
    name: "백제의 미소",
    image: `${import.meta.env.BASE_URL}assets/monsters/baekje-smile.png`,
    displayScale: 1.08,
    aspectRatio: 3 / 2,
    anchor: [0, -0.03, 0],
  },
  "goguryeo-samjogo": {
    id: "goguryeo-samjogo",
    name: "고구려 삼족오",
    image: `${import.meta.env.BASE_URL}assets/monsters/goguryeo-samjogo.png`,
    displayScale: 1.08,
    aspectRatio: 3 / 2,
    anchor: [0, -0.03, 0],
  },
  "twisted-pensive-bodhisattva": {
    id: "twisted-pensive-bodhisattva",
    name: "뒤틀린 반가사유상",
    image: `${import.meta.env.BASE_URL}assets/monsters/twisted-pensive-bodhisattva.png`,
    displayScale: 1.14,
    aspectRatio: 2 / 3,
    anchor: [0, -0.04, 0],
  },
  "gold-crown-wraith": { id: "gold-crown-wraith", name: "금관의 원혼", image: `${import.meta.env.BASE_URL}assets/monsters/gold-crown-wraith.png`, displayScale: 1.08, aspectRatio: 1, anchor: [0, -0.03, 0] },
  "corrupted-gaya-pottery": { id: "corrupted-gaya-pottery", name: "오염된 가야 토기", image: `${import.meta.env.BASE_URL}assets/monsters/corrupted-gaya-pottery.png`, displayScale: 1.08, aspectRatio: 2 / 3, anchor: [0, -0.03, 0] },
  "silla-cheonma": { id: "silla-cheonma", name: "신라의 천마", image: `${import.meta.env.BASE_URL}assets/monsters/silla-cheonma.png`, displayScale: 1.14, aspectRatio: 3 / 2, anchor: [0, -0.04, 0] },
  "baekje-archer": { id: "baekje-archer", name: "백제 궁병", image: `${import.meta.env.BASE_URL}assets/monsters/baekje-archer.png`, displayScale: 1.08, aspectRatio: 1, anchor: [0, -0.03, 0] },
  "goguryeo-cavalry": { id: "goguryeo-cavalry", name: "고구려 기마병", image: `${import.meta.env.BASE_URL}assets/monsters/goguryeo-cavalry.png`, displayScale: 1.08, aspectRatio: 1, anchor: [0, -0.03, 0] },
  "corrupted-munmu-wraith": { id: "corrupted-munmu-wraith", name: "오염된 문무왕의 망령", image: `${import.meta.env.BASE_URL}assets/monsters/corrupted-munmu-wraith.png`, displayScale: 1.14, aspectRatio: 1, anchor: [0, -0.04, 0] },
  "balhae-refugee-spirit": { id: "balhae-refugee-spirit", name: "발해 유민의 혼", image: `${import.meta.env.BASE_URL}assets/dungeon6/balhae-refugee-spirit.png`, displayScale: 1.1, aspectRatio: 1168 / 1346, anchor: [0, -0.04, 0] },
  "balhae-guardian-stone-lion": { id: "balhae-guardian-stone-lion", name: "발해 수호 돌사자상", image: `${import.meta.env.BASE_URL}assets/dungeon6/balhae-guardian-stone-lion.png`, displayScale: 1.12, aspectRatio: 1182 / 1330, anchor: [0, -0.04, 0] },
  "corrupted-double-buddha": { id: "corrupted-double-buddha", name: "오염된 이불병좌상", image: `${import.meta.env.BASE_URL}assets/dungeon6/corrupted-double-buddha.png`, displayScale: 1.15, aspectRatio: 2 / 3, anchor: [0, -0.04, 0] },
  "later-baekje-soldier-spirit": { id: "later-baekje-soldier-spirit", name: "후백제 병사의 원혼", image: `${import.meta.env.BASE_URL}assets/dungeon7/later-baekje-soldier-spirit.png`, displayScale: 1.12, aspectRatio: 2 / 3, anchor: [0, -0.04, 0] },
  "later-goguryeo-soldier-spirit": { id: "later-goguryeo-soldier-spirit", name: "후고구려 병사의 원혼", image: `${import.meta.env.BASE_URL}assets/dungeon7/later-goguryeo-soldier-spirit.png`, displayScale: 1.15, aspectRatio: 2 / 3, anchor: [0, -0.04, 0] },
  "khitan-soldier-spirit": { id: "khitan-soldier-spirit", name: "거란 병사의 원혼", image: `${import.meta.env.BASE_URL}assets/dungeon8/khitan-soldier-spirit.png`, displayScale: 1.12, aspectRatio: 2 / 3, anchor: [0, -0.04, 0] },
  "jurchen-soldier-spirit": { id: "jurchen-soldier-spirit", name: "여진족 병사의 원혼", image: `${import.meta.env.BASE_URL}assets/dungeon8/jurchen-soldier-spirit.png`, displayScale: 1.12, aspectRatio: 2 / 3, anchor: [0, -0.04, 0] },
  "mongol-general-armor": { id: "mongol-general-armor", name: "몽골 장군의 갑주", image: `${import.meta.env.BASE_URL}assets/dungeon8/mongol-general-armor.png`, displayScale: 1.18, aspectRatio: 2 / 3, anchor: [0, -0.04, 0] },
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
