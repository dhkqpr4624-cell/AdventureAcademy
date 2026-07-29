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
};

export const ITEM_DEFINITION_REGISTRY: Record<string, ItemDefinition> = {
  "weapon-basic-sword": {
    id: "weapon-basic-sword", name: "기본 목검", type: "weaponSkin",
    rarity: "common", description: "아카데미에서 지급한 기본 목검이다.",
    icon: "🗡️", stackable: false,
  },
  "potion-small": {
    id: "potion-small", name: "소형 회복 포션", type: "consumable",
    rarity: "common", description: "던전 전투 중 HP를 20 회복한다.",
    icon: "🧪", stackable: true,
  },
  "potion-medium": {
    id: "potion-medium", name: "중형 회복 포션", type: "consumable",
    rarity: "uncommon", description: "던전 전투 중 HP를 35 회복한다.",
    icon: "⚗️", stackable: true,
  },
};

export const getItemDefinition = (itemId: string) =>
  ITEM_DEFINITION_REGISTRY[itemId] ?? null;
