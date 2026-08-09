import { getArmorMaxHpBonusForFloor } from "../balance/floorBalance";

export type ItemType = "weaponSkin" | "armor" | "consumable" | "misc";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic";

export type ItemDefinition = {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  icon: string;
  stackable: boolean;
  equipmentStats?: {
    maxHpBonus: number;
  };
};

export const ITEM_DEFINITION_REGISTRY: Record<string, ItemDefinition> = {
  "weapon-basic-sword": {
    id: "weapon-basic-sword", name: "기본 목검", type: "weaponSkin",
    rarity: "common", description: "아카데미에서 지급한 기본 목검이다.",
    icon: `${import.meta.env.BASE_URL}assets/items/basic-sword.png`, stackable: false,
  },
  "weapon-gojoseon-bronze-dagger": {
    id: "weapon-gojoseon-bronze-dagger", name: "고조선 비파형 동검", type: "weaponSkin",
    rarity: "rare", description: "고조선의 비파형 동검을 본뜬 희귀 무기 스킨이다.",
    icon: `${import.meta.env.BASE_URL}assets/items/bipa-bronze-sword.png`, stackable: false,
  },
  "weapon-tanged-point": {
    id: "weapon-tanged-point", name: "슴베찌르개", type: "weaponSkin",
    rarity: "rare", description: "선사시대의 슴베찌르개를 본뜬 희귀 무기 스킨이다.",
    icon: `${import.meta.env.BASE_URL}assets/items/tanged-point.png`, stackable: false,
  },
  "armor-gwanggaeto": {
    id: "armor-gwanggaeto", name: "광개토대왕 갑옷", type: "armor",
    rarity: "rare", description: "고구려의 위대한 정복 군주를 상징하는 갑옷.",
    icon: `${import.meta.env.BASE_URL}assets/items/gwanggaeto-armor.png`,
    stackable: false,
    equipmentStats: { maxHpBonus: getArmorMaxHpBonusForFloor(3) },
  },
  "quest-memory-fragment": {
    id: "quest-memory-fragment", name: "뒤틀린 기억의 조각", type: "misc",
    rarity: "rare", description: "카이든이 가진 조각과 꼭 맞을 듯한 비석 조각이다.",
    icon: "🪨", stackable: false,
  },
  "quest-hand-axe": { id: "quest-hand-axe", name: "주먹도끼", type: "misc", rarity: "rare", description: "구석기 시대의 주먹도끼다.", icon: `${import.meta.env.BASE_URL}assets/items/hand-axe.png`, stackable: false },
  "quest-tanged-point": { id: "quest-tanged-point", name: "슴베찌르개", type: "misc", rarity: "rare", description: "구석기 시대의 슴베찌르개다.", icon: `${import.meta.env.BASE_URL}assets/items/tanged-point.png`, stackable: false },
  "quest-comb-pattern-pottery": { id: "quest-comb-pattern-pottery", name: "빗살무늬 토기", type: "misc", rarity: "rare", description: "신석기 시대의 빗살무늬 토기다.", icon: `${import.meta.env.BASE_URL}assets/items/comb-pattern-pottery.png`, stackable: false },
  "quest-torn-cloth": {
    id: "quest-torn-cloth", name: "천 조각", type: "misc",
    rarity: "rare", description: "던전 3층에서 발견한, 시대와 어울리지 않는 찢어진 천 조각이다.",
    icon: `${import.meta.env.BASE_URL}assets/items/torn-cloth.png`, stackable: false,
  },
  "potion-small": {
    id: "potion-small", name: "소형 회복 포션", type: "consumable",
    rarity: "common", description: "던전 전투 중 HP를 20 회복한다.",
    icon: `${import.meta.env.BASE_URL}assets/items/potion-small.png`, stackable: true,
  },
  "potion-medium": {
    id: "potion-medium", name: "중형 회복 포션", type: "consumable",
    rarity: "uncommon", description: "던전 전투 중 HP를 35 회복한다.",
    icon: `${import.meta.env.BASE_URL}assets/items/potion-medium.png`, stackable: true,
  },
};

export const getItemDefinition = (itemId: string) =>
  ITEM_DEFINITION_REGISTRY[itemId] ?? null;
