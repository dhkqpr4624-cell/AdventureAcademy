import { INITIAL_PLAYER_STATE } from "../player/playerState";
import {
  INITIAL_INVENTORY_STATE,
  getItemQuantity,
  recalculatePlayerMaxHp,
} from "./inventoryState";
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

  const armorInventory = {
    ...INITIAL_INVENTORY_STATE,
    items: {
      ...INITIAL_INVENTORY_STATE.items,
      "armor-gwanggaeto": 1,
    },
    equippedItemIds: {
      ...INITIAL_INVENTORY_STATE.equippedItemIds,
      armor: "armor-gwanggaeto",
    },
  };
  const equippedAtFullHp = recalculatePlayerMaxHp(
    INITIAL_PLAYER_STATE,
    INITIAL_INVENTORY_STATE,
    armorInventory,
  );
  check(
    equippedAtFullHp.currentHp === 55 && equippedAtFullHp.maxHp === 55,
    "equipping armor at full HP changes 50 / 50 to 55 / 55",
  );
  const equippedWhileDamaged = recalculatePlayerMaxHp(
    { ...INITIAL_PLAYER_STATE, currentHp: 40 },
    INITIAL_INVENTORY_STATE,
    armorInventory,
  );
  check(
    equippedWhileDamaged.currentHp === 40 && equippedWhileDamaged.maxHp === 55,
    "equipping armor while damaged preserves 40 HP",
  );
  const unequippedAboveBaseMax = recalculatePlayerMaxHp(
    { ...INITIAL_PLAYER_STATE, currentHp: 53, maxHp: 55 },
    armorInventory,
    INITIAL_INVENTORY_STATE,
  );
  check(
    unequippedAboveBaseMax.currentHp === 50 &&
      unequippedAboveBaseMax.maxHp === 50,
    "unequipping armor clamps 53 / 55 to 50 / 50",
  );
  console.info("inventory/shop checks: PASS");
}
