import type { FloorDefinition, FloorUnlockState } from "./floorTypes";

export const FLOOR_DEFINITIONS: readonly FloorDefinition[] = [
  {
    id: "floor-1",
    order: 1,
    title: "1층",
    questId: "quest-floor-1-prehistory",
    questionCount: 10,
  },
  {
    id: "floor-2",
    order: 2,
    title: "2층",
    questId: "quest-floor-2-memory-fragment",
    questionCount: 11,
  },
  {
    id: "floor-3",
    order: 3,
    title: "3층",
    questId: "quest-floor-3-torn-cloth",
    questionCount: 12,
  },
  {
    id: "floor-4",
    order: 4,
    title: "4층",
    questId: "quest-floor-4-jeon-rescue",
    questionCount: 12,
  },
  { id: "floor-5", order: 5, title: "5층", questId: "quest-floor-5-unified-silla", questionCount: 12 },
  { id: "floor-6", order: 6, title: "6층", questId: "quest-floor-6-balhae", questionCount: 12 },
  { id: "floor-7", order: 7, title: "7층", questId: "quest-floor-7-goryeo-founding", questionCount: 12 },
];

export const INITIAL_FLOOR_UNLOCK_STATE: FloorUnlockState = {
  unlockedFloorIds: [],
};
