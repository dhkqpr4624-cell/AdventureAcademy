import type {
  DungeonFacing,
  DungeonRoomNode,
  RelativeDungeonDirection,
  TraversableDungeonConnection,
  WorldCardinalDirection,
} from "../dungeonTypes";

const ORDER: WorldCardinalDirection[] = ["north", "east", "south", "west"];

export function oppositeWorldDirection(
  direction: WorldCardinalDirection,
): WorldCardinalDirection {
  return ORDER[(ORDER.indexOf(direction) + 2) % 4];
}

export function worldDirectionBetween(
  source: DungeonRoomNode,
  target: DungeonRoomNode,
): WorldCardinalDirection {
  const dx = target.position.x - source.position.x;
  const dz = target.position.z - source.position.z;
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? "east" : "west";
  return dz > 0 ? "south" : "north";
}

export function resolveRelativeDirection(input: {
  currentFacing: DungeonFacing;
  connectionWorldDirection: WorldCardinalDirection;
}): RelativeDungeonDirection {
  const delta =
    (ORDER.indexOf(input.connectionWorldDirection) -
      ORDER.indexOf(input.currentFacing) +
      4) %
    4;
  return (["forward", "right", "back", "left"] as const)[delta];
}

export function facingFromCameraPose(
  position: readonly [number, number, number],
  lookAt: readonly [number, number, number],
): DungeonFacing {
  const dx = lookAt[0] - position[0];
  const dz = lookAt[2] - position[2];
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? "east" : "west";
  return dz > 0 ? "south" : "north";
}

export function labelRoutesRelativeToFacing(input: {
  currentRoom: DungeonRoomNode;
  routes: TraversableDungeonConnection[];
  currentFacing: DungeonFacing;
  getRoom: (roomId: string) => DungeonRoomNode;
}): TraversableDungeonConnection[] {
  return input.routes.map((route) => {
    const worldDirection = worldDirectionBetween(
      input.currentRoom,
      input.getRoom(route.targetRoomId),
    );
    return {
      ...route,
      worldDirection,
      direction: resolveRelativeDirection({
        currentFacing: input.currentFacing,
        connectionWorldDirection: worldDirection,
      }),
    };
  });
}

export function findDuplicateRelativeDirections(
  routes: readonly TraversableDungeonConnection[],
): RelativeDungeonDirection[] {
  const seen = new Set<RelativeDungeonDirection>();
  const duplicates = new Set<RelativeDungeonDirection>();
  for (const route of routes) {
    if (seen.has(route.direction)) duplicates.add(route.direction);
    seen.add(route.direction);
  }
  return [...duplicates];
}
