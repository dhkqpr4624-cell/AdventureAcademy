import { changeItemQuantity, getItemQuantity, type InventoryState } from "./inventoryState";
import { getPotionPriceForFloor } from "../balance/floorBalance";

export const SHOP_PRODUCTS = [
  { itemId: "potion-small", price: getPotionPriceForFloor(1, "small"), kind: "potion" },
  { itemId: "potion-medium", price: getPotionPriceForFloor(1, "medium"), kind: "potion" },
  { itemId: "upgrade-small-potion-pouch", price: 100, kind: "upgrade", maxPurchases: 2 },
  { itemId: "upgrade-medium-potion-pouch", price: 200, kind: "upgrade", maxPurchases: 1 },
] as const;

const BASE_POTION_CAPACITY = {
  "potion-small": 3,
  "potion-medium": 2,
} as const;

export function getPotionMaxQuantity(
  inventory: InventoryState,
  itemId: keyof typeof BASE_POTION_CAPACITY,
): number {
  const upgradeId = itemId === "potion-small"
    ? "upgrade-small-potion-pouch"
    : "upgrade-medium-potion-pouch";
  const maxUpgradeCount = itemId === "potion-small" ? 2 : 1;
  return BASE_POTION_CAPACITY[itemId] + Math.min(
    getItemQuantity(inventory, upgradeId),
    maxUpgradeCount,
  );
}

export function getShopProductMaxQuantity(
  inventory: InventoryState,
  itemId: string,
): number | null {
  if (itemId === "potion-small" || itemId === "potion-medium") {
    return getPotionMaxQuantity(inventory, itemId);
  }
  const product = SHOP_PRODUCTS.find((candidate) => candidate.itemId === itemId);
  return product?.kind === "upgrade" ? product.maxPurchases : null;
}

export type ShopPurchaseResult =
  | { success: true; gold: number; inventory: InventoryState }
  | { success: false; reason: "unknownProduct" | "insufficientGold" | "maxQuantity" };

export function purchaseShopItem(
  inventory: InventoryState,
  gold: number,
  itemId: string,
): ShopPurchaseResult {
  const product = SHOP_PRODUCTS.find((candidate) => candidate.itemId === itemId);
  if (!product) return { success: false, reason: "unknownProduct" };
  const maxQuantity = getShopProductMaxQuantity(inventory, itemId);
  if (maxQuantity === null || getItemQuantity(inventory, itemId) >= maxQuantity) {
    return { success: false, reason: "maxQuantity" };
  }
  if (gold < product.price) return { success: false, reason: "insufficientGold" };
  return {
    success: true,
    gold: gold - product.price,
    inventory: changeItemQuantity(inventory, itemId, 1),
  };
}
