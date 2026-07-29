import { changeItemQuantity, getItemQuantity, type InventoryState } from "./inventoryState";

export const SHOP_PRODUCTS = [
  { itemId: "potion-small", price: 8, maxQuantity: 3 },
  { itemId: "potion-medium", price: 15, maxQuantity: 2 },
] as const;

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
  if (getItemQuantity(inventory, itemId) >= product.maxQuantity) {
    return { success: false, reason: "maxQuantity" };
  }
  if (gold < product.price) return { success: false, reason: "insufficientGold" };
  return {
    success: true,
    gold: gold - product.price,
    inventory: changeItemQuantity(inventory, itemId, 1),
  };
}
