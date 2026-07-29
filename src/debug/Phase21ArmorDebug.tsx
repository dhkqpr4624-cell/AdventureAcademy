import { useState } from "react";
import {
  calculatePlayerMaxHp,
  changeItemQuantity,
  getItemQuantity,
  type InventoryState,
} from "../game/inventory/inventoryState";

export const PHASE21_DEBUG_ARMOR_ID = "armor-gwanggaeto";

export function grantPhase21Armor(
  inventory: InventoryState,
): { inventory: InventoryState; granted: boolean } {
  if (getItemQuantity(inventory, PHASE21_DEBUG_ARMOR_ID) > 0) {
    return { inventory, granted: false };
  }
  return {
    inventory: changeItemQuantity(inventory, PHASE21_DEBUG_ARMOR_ID, 1),
    granted: true,
  };
}

export function runPhase21ArmorDebugChecks(): void {
  const empty: InventoryState = {
    items: {},
    equippedItemIds: { weaponSkin: null, armor: null },
  };
  const first = grantPhase21Armor(empty);
  if (!first.granted || getItemQuantity(first.inventory, PHASE21_DEBUG_ARMOR_ID) !== 1) {
    throw new Error("[Phase21ArmorDebug] first grant must add one armor");
  }
  const duplicate = grantPhase21Armor(first.inventory);
  if (duplicate.granted || getItemQuantity(duplicate.inventory, PHASE21_DEBUG_ARMOR_ID) !== 1) {
    throw new Error("[Phase21ArmorDebug] duplicate grant must be blocked");
  }
  const equipped: InventoryState = {
    ...first.inventory,
    equippedItemIds: {
      ...first.inventory.equippedItemIds,
      armor: PHASE21_DEBUG_ARMOR_ID,
    },
  };
  if (calculatePlayerMaxHp(equipped) !== 55) {
    throw new Error("[Phase21ArmorDebug] equipped armor must provide 5 max HP");
  }
}

export function Phase21ArmorDebug({
  inventory,
  onGrant,
}: {
  inventory: InventoryState;
  onGrant: (inventory: InventoryState) => void;
}) {
  const [open, setOpen] = useState(false);
  const owned = getItemQuantity(inventory, PHASE21_DEBUG_ARMOR_ID) > 0;

  return (
    <aside
      aria-label="Phase21 Debug"
      style={{
        position: "fixed",
        right: 16,
        bottom: 72,
        zIndex: 10000,
        display: "grid",
        gap: 8,
      }}
    >
      <button type="button" onClick={() => setOpen((current) => !current)}>
        Debug
      </button>
      {open && (
        <button
          type="button"
          disabled={owned}
          onClick={() => {
            const result = grantPhase21Armor(inventory);
            if (result.granted) onGrant(result.inventory);
          }}
        >
          {owned ? "광개토대왕의 갑옷 보유 중" : "광개토대왕의 갑옷 지급"}
        </button>
      )}
    </aside>
  );
}
