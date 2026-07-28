export type FloorId = "floor-1";

export type FloorDefinition = {
  id: FloorId;
  order: number;
  title: string;
  questId: string;
};

export type FloorUnlockState = {
  unlockedFloorIds: FloorId[];
};

export type UnlockFloorResult = {
  success: boolean;
  changed: boolean;
  nextState: FloorUnlockState;
  reason?: "floorNotFound";
};
