export type InventoryState = {
  items: Record<string, number>;
  equippedItemIds: Record<string, string | null>;
};

export const INITIAL_INVENTORY_STATE: InventoryState = {
  items: {
    "weapon-basic-sword": 1,
    "potion-small": 2,
    "potion-medium": 1,
  },
  equippedItemIds: { weaponSkin: "weapon-basic-sword" },
};

export function getItemQuantity(state: InventoryState, itemId: string) {
  return Math.max(0, Math.floor(state.items[itemId] ?? 0));
}

export function changeItemQuantity(
  state: InventoryState,
  itemId: string,
  delta: number,
): InventoryState {
  const quantity = Math.max(0, getItemQuantity(state, itemId) + Math.trunc(delta));
  const items = { ...state.items };
  if (quantity === 0) delete items[itemId];
  else items[itemId] = quantity;
  return { ...state, items };
}
