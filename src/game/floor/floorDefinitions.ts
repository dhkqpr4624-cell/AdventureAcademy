import type { FloorDefinition, FloorUnlockState } from "./floorTypes";

export const FLOOR_DEFINITIONS: readonly FloorDefinition[] = [
  {
    id: "floor-1",
    order: 1,
    title: "1층",
    questId: "quest-floor-1-memory-fragment",
  },
];

export const INITIAL_FLOOR_UNLOCK_STATE: FloorUnlockState = {
  unlockedFloorIds: [],
};
