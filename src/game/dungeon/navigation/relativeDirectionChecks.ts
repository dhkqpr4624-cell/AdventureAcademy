import {
  facingFromCameraPose,
  resolveRelativeDirection,
} from "./relativeDirectionResolver";
import type { DungeonFacing, WorldCardinalDirection } from "../dungeonTypes";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[relative direction check] ${message}`);
}

export function runRelativeDirectionChecks(): void {
  const cases: Record<
    DungeonFacing,
    [WorldCardinalDirection, "forward" | "left" | "right" | "back"][]
  > = {
    north: [["north", "forward"], ["west", "left"], ["east", "right"], ["south", "back"]],
    east: [["east", "forward"], ["north", "left"], ["south", "right"], ["west", "back"]],
    south: [["south", "forward"], ["east", "left"], ["west", "right"], ["north", "back"]],
    west: [["west", "forward"], ["south", "left"], ["north", "right"], ["east", "back"]],
  };
  for (const [facing, entries] of Object.entries(cases)) {
    for (const [world, expected] of entries) {
      check(
        resolveRelativeDirection({
          currentFacing: facing as DungeonFacing,
          connectionWorldDirection: world,
        }) === expected,
        `${facing}/${world} must be ${expected}`,
      );
    }
  }
  check(
    facingFromCameraPose([0, 0, 0], [1, 0, 0]) === "east",
    "Three camera +X yaw must resolve east",
  );
  check(
    facingFromCameraPose([0, 0, 0], [0, 0, -1]) === "north",
    "Three camera -Z forward must resolve north",
  );
}
