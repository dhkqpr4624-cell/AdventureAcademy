import type { CorridorTemplate } from "./dungeonVisualTypes";

export const FLOOR1_STANDARD_CORRIDOR: CorridorTemplate = {
  id: "floor1-standard-corridor",
  width: 4,
  height: 6,
  wallThickness: 0.18,
  materials: { wall: "wall", floor: "floor", ceiling: "ceiling" },
};
