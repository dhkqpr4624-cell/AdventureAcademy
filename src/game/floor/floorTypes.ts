export type FloorId = "floor-1" | "floor-2" | "floor-3" | "floor-4" | "floor-5" | "floor-6" | "floor-7" | "floor-8" | "floor-9" | "floor-10";

export type FloorDefinition = {
  id: FloorId;
  order: number;
  title: string;
  questId: string;
  questionCount: number;
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
