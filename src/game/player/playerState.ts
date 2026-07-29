export const PLAYER_MAX_HP = 50;

export type PlayerState = {
  name?: string;
  currentHp: number;
  maxHp: number;
  gold: number;
};

export const INITIAL_PLAYER_STATE: PlayerState = {
  name: "",
  currentHp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  gold: 0,
};
