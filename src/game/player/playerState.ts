export const PLAYER_MAX_HP = 50;

export type PlayerState = {
  currentHp: number;
  maxHp: number;
  gold: number;
};

export const INITIAL_PLAYER_STATE: PlayerState = {
  currentHp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  gold: 0,
};
