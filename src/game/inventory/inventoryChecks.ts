import { INITIAL_INVENTORY_STATE, getItemQuantity } from "./inventoryState";
import { purchaseShopItem } from "./shopResolver";

const check = (value: boolean, message: string) => {
  if (!value) throw new Error(`[inventory checks] ${message}`);
};

export function runInventoryChecks() {
  const bought = purchaseShopItem(INITIAL_INVENTORY_STATE, 20, "potion-small");
  check(bought.success && bought.gold === 12, "purchase deducts gold");
  check(bought.success && getItemQuantity(bought.inventory, "potion-small") === 3, "purchase grants item");
  const capped = bought.success
    ? purchaseShopItem(bought.inventory, bought.gold, "potion-small")
    : bought;
  check(!capped.success && capped.reason === "maxQuantity", "small potion cap");
  const medium1 = purchaseShopItem(INITIAL_INVENTORY_STATE, 50, "potion-medium");
  const medium2 = medium1.success
    ? purchaseShopItem(medium1.inventory, medium1.gold, "potion-medium")
    : medium1;
  check(!medium2.success && medium2.reason === "maxQuantity", "medium potion cap");
  check(!purchaseShopItem(INITIAL_INVENTORY_STATE, 0, "potion-medium").success, "insufficient gold");
  console.info("inventory/shop checks: PASS");
}
