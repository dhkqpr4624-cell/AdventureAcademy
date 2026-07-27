export const PLAYER_LEVEL = 1;
export const PLAYER_MAX_HP = 50;

export type PlayerState = {
  level: number;
  currentHp: number;
  maxHp: number;
};

export const INITIAL_PLAYER_STATE: PlayerState = {
  level: PLAYER_LEVEL,
  currentHp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
};

