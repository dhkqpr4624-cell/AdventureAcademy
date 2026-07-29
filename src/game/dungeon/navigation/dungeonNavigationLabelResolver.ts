import type {
  DungeonRoomNode,
  RelativeDungeonDirection,
  TraversableDungeonConnection,
} from "../dungeonTypes";
import { worldDirectionBetween } from "./relativeDirectionResolver";

export function navigationLabelFromWorldDirection(
  worldDirection: NonNullable<TraversableDungeonConnection["worldDirection"]>,
): RelativeDungeonDirection {
  switch (worldDirection) {
    case "north":
      return "forward";
    case "west":
      return "left";
    case "east":
      return "right";
    case "south":
      return "back";
  }
}

export function labelDungeonNavigationRoutes(input: {
  currentRoom: DungeonRoomNode;
  routes: TraversableDungeonConnection[];
  getRoom: (roomId: string) => DungeonRoomNode;
}): TraversableDungeonConnection[] {
  const labeled = input.routes.map((route) => {
    const worldDirection = worldDirectionBetween(
      input.currentRoom,
      input.getRoom(route.targetRoomId),
    );
    const direction = navigationLabelFromWorldDirection(worldDirection);
    return { ...route, direction, worldDirection };
  });

  const labels = new Set<RelativeDungeonDirection>();
  for (const route of labeled) {
    if (labels.has(route.direction)) {
      throw new Error(
        `[dungeon navigation] duplicate direction ${route.direction} in ${input.currentRoom.id}`,
      );
    }
    labels.add(route.direction);
  }
  return labeled;
}
