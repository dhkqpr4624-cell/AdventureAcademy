import { BASE_PLAYER_MAX_HP } from "../balance/floorBalance";
import type { PlayerState } from "../player/playerState";
import { getItemDefinition } from "./itemDefinitions";

export type EquipmentSlot = "weaponSkin" | "armor";

export type InventoryState = {
  items: Record<string, number>;
  equippedItemIds: Record<EquipmentSlot, string | null>;
};

export const INITIAL_INVENTORY_STATE: InventoryState = {
  items: {
    "weapon-basic-sword": 1,
    "potion-small": 2,
    "potion-medium": 1,
  },
  equippedItemIds: { weaponSkin: "weapon-basic-sword", armor: null },
};

export function calculateEquippedMaxHpBonus(state: InventoryState): number {
  const armorId = state.equippedItemIds.armor;
  const armor = armorId ? getItemDefinition(armorId) : null;
  return armor?.type === "armor"
    ? Math.max(0, armor.equipmentStats?.maxHpBonus ?? 0)
    : 0;
}

export function calculatePlayerMaxHp(state: InventoryState): number {
  return BASE_PLAYER_MAX_HP + calculateEquippedMaxHpBonus(state);
}

export function recalculatePlayerMaxHp(
  player: PlayerState,
  previousInventory: InventoryState,
  nextInventory: InventoryState,
): PlayerState {
  const previousMaxHp = calculatePlayerMaxHp(previousInventory);
  const nextMaxHp = calculatePlayerMaxHp(nextInventory);
  const wasAtFullHp = player.currentHp >= previousMaxHp;

  return {
    ...player,
    maxHp: nextMaxHp,
    currentHp: wasAtFullHp
      ? nextMaxHp
      : Math.min(player.currentHp, nextMaxHp),
  };
}

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
