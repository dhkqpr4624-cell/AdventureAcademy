import { INITIAL_PLAYER_STATE } from "../player/playerState";
import {
  INITIAL_INVENTORY_STATE,
  getItemQuantity,
  recalculatePlayerMaxHp,
} from "./inventoryState";
import { getPotionMaxQuantity, purchaseShopItem } from "./shopResolver";

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

  const smallPouch1 = purchaseShopItem(INITIAL_INVENTORY_STATE, 500, "upgrade-small-potion-pouch");
  check(
    smallPouch1.success && getPotionMaxQuantity(smallPouch1.inventory, "potion-small") === 4,
    "first small potion pouch raises capacity to 4",
  );
  const smallPouch2 = smallPouch1.success
    ? purchaseShopItem(smallPouch1.inventory, smallPouch1.gold, "upgrade-small-potion-pouch")
    : smallPouch1;
  check(
    smallPouch2.success && getPotionMaxQuantity(smallPouch2.inventory, "potion-small") === 5,
    "second small potion pouch raises capacity to 5",
  );
  const smallPouch3 = smallPouch2.success
    ? purchaseShopItem(smallPouch2.inventory, smallPouch2.gold, "upgrade-small-potion-pouch")
    : smallPouch2;
  check(!smallPouch3.success && smallPouch3.reason === "maxQuantity", "third small potion pouch is blocked");

  const mediumPouch1 = purchaseShopItem(INITIAL_INVENTORY_STATE, 500, "upgrade-medium-potion-pouch");
  check(
    mediumPouch1.success && getPotionMaxQuantity(mediumPouch1.inventory, "potion-medium") === 3,
    "medium potion pouch raises capacity to 3",
  );
  const mediumPouch2 = mediumPouch1.success
    ? purchaseShopItem(mediumPouch1.inventory, mediumPouch1.gold, "upgrade-medium-potion-pouch")
    : mediumPouch1;
  check(!mediumPouch2.success && mediumPouch2.reason === "maxQuantity", "second medium potion pouch is blocked");
  check(
    !purchaseShopItem(INITIAL_INVENTORY_STATE, 99, "upgrade-small-potion-pouch").success,
    "potion pouch respects insufficient gold",
  );

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
