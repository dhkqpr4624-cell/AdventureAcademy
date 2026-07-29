import type {
  DungeonCameraPathStep,
  DungeonFacing,
  DungeonRoomNode,
  TraversableDungeonConnection,
  WorldCardinalDirection,
} from "../dungeonTypes";
import { worldDirectionBetween } from "./relativeDirectionResolver";

export const DUNGEON_CANONICAL_FACING: DungeonFacing = "north";
export const DUNGEON_CANONICAL_YAW = 0;

const CAMERA_Y = 0.2;
const YAW_BY_DIRECTION: Record<WorldCardinalDirection, number> = {
  north: 0,
  east: -Math.PI / 2,
  south: Math.PI,
  west: Math.PI / 2,
};

function center(room: DungeonRoomNode): [number, number, number] {
  return [room.position.x, CAMERA_Y, room.position.z];
}

export function buildDungeonNavigationPath(input: {
  sourceRoom: DungeonRoomNode;
  targetRoom: DungeonRoomNode;
  route: TraversableDungeonConnection;
}): DungeonCameraPathStep[] {
  const direction = worldDirectionBetween(input.sourceRoom, input.targetRoom);
  const destination = center(input.targetRoom);

  if (direction === "south") {
    return [{
      type: "move",
      position: destination,
      movementMode: "backward",
    }];
  }

  if (direction === "north") {
    return [{
      type: "move",
      position: destination,
      movementMode: "forward",
    }];
  }

  const sideYaw = YAW_BY_DIRECTION[direction];
  return [
    { type: "rotate", yaw: sideYaw },
    {
      type: "move",
      position: destination,
      movementMode: "forward",
    },
    { type: "rotate", yaw: DUNGEON_CANONICAL_YAW },
  ];
}

export function finalYawForNavigationPath(
  steps: readonly DungeonCameraPathStep[],
): number {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (step.type === "rotate") return step.yaw;
  }
  return DUNGEON_CANONICAL_YAW;
}
