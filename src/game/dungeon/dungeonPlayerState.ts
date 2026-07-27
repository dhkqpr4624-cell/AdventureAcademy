export const DUNGEON_PLAYER_MAX_HP = 50;
export const INITIAL_SMALL_POTION_QUANTITY = 2;
export const INITIAL_MEDIUM_POTION_QUANTITY = 1;

export type DungeonPlayerState = {
  hp: number;
  smallPotionQuantity: number;
  mediumPotionQuantity: number;
};

export type DungeonPlayerStateResetScope = "encounter" | "dungeonRun";

export const INITIAL_DUNGEON_PLAYER_STATE: DungeonPlayerState = {
  hp: DUNGEON_PLAYER_MAX_HP,
  smallPotionQuantity: INITIAL_SMALL_POTION_QUANTITY,
  mediumPotionQuantity: INITIAL_MEDIUM_POTION_QUANTITY,
};

export function clampDungeonPlayerHp(hp: number): number {
  return Math.max(0, Math.min(DUNGEON_PLAYER_MAX_HP, hp));
}

export function applyDungeonPlayerDamage(
  currentHp: number,
  damage: number,
): number {
  return clampDungeonPlayerHp(currentHp - Math.max(0, damage));
}

export function applyDungeonPlayerHealing(
  currentHp: number,
  healing: number,
): number {
  return clampDungeonPlayerHp(currentHp + Math.max(0, healing));
}

export function resolveDungeonPlayerStateReset(
  state: DungeonPlayerState,
  scope: DungeonPlayerStateResetScope,
): DungeonPlayerState {
  if (scope === "encounter") {
    return { ...state };
  }
  return { ...INITIAL_DUNGEON_PLAYER_STATE };
}
