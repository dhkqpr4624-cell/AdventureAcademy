import type { RoomVisualTemplate } from "./dungeonVisualTypes";

export const FLOOR1_STANDARD_ROOM: RoomVisualTemplate = {
  id: "floor1-standard-room",
  width: 10,
  height: 6,
  depth: 10,
  wallThickness: 0.18,
  passageWidth: 4,
  passageHeight: 4.5,
  materials: { wall: "wall", floor: "floor", ceiling: "ceiling" },
};
