import { FLOOR_DEFINITIONS } from "./floorDefinitions";
import type {
  FloorId,
  FloorUnlockState,
  UnlockFloorResult,
} from "./floorTypes";

const floorIds = new Set(FLOOR_DEFINITIONS.map((floor) => floor.id));

export const FloorUnlockManager = {
  unlockFloor(
    state: FloorUnlockState,
    floorId: FloorId,
  ): UnlockFloorResult {
    if (!floorIds.has(floorId)) {
      return {
        success: false,
        changed: false,
        nextState: state,
        reason: "floorNotFound",
      };
    }
    if (state.unlockedFloorIds.includes(floorId)) {
      return { success: true, changed: false, nextState: state };
    }
    return {
      success: true,
      changed: true,
      nextState: {
        ...state,
        unlockedFloorIds: [...state.unlockedFloorIds, floorId],
      },
    };
  },

  isUnlocked(state: FloorUnlockState, floorId: FloorId): boolean {
    return state.unlockedFloorIds.includes(floorId);
  },

  getUnlockedFloors(state: FloorUnlockState): FloorId[] {
    return [...state.unlockedFloorIds];
  },
};
