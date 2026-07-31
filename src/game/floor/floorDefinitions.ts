import type { FloorDefinition, FloorUnlockState } from "./floorTypes";

export const FLOOR_DEFINITIONS: readonly FloorDefinition[] = [
  {
    id: "floor-1",
    order: 1,
    title: "1층",
    questId: "quest-floor-1-memory-fragment",
  },
  {
    id: "floor-2",
    order: 2,
    title: "2층",
    questId: "quest-floor-2-torn-cloth",
  },
];

export const INITIAL_FLOOR_UNLOCK_STATE: FloorUnlockState = {
  unlockedFloorIds: [],
};
