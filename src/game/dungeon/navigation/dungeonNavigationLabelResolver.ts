import type {
  DungeonRoomNode,
  RelativeDungeonDirection,
  TraversableDungeonConnection,
} from "../dungeonTypes";
import {
  resolveRelativeDirection,
  worldDirectionBetween,
} from "./relativeDirectionResolver";
import { DUNGEON_CANONICAL_FACING } from "./dungeonNavigationPathBuilder";

export function labelDungeonNavigationRoutes(input: {
  currentRoom: DungeonRoomNode;
  routes: TraversableDungeonConnection[];
  previousRoomId: string | null;
  getRoom: (roomId: string) => DungeonRoomNode;
}): TraversableDungeonConnection[] {
  const labeled = input.routes.flatMap((route) => {
    const worldDirection = worldDirectionBetween(
      input.currentRoom,
      input.getRoom(route.targetRoomId),
    );
    const isBackRoute = route.targetRoomId === input.previousRoomId;
    if (
      !isBackRoute &&
      resolveRelativeDirection({
        currentFacing: DUNGEON_CANONICAL_FACING,
        connectionWorldDirection: worldDirection,
      }) === "back"
    ) {
      return [];
    }
    const direction: RelativeDungeonDirection = isBackRoute
      ? "back"
      : resolveRelativeDirection({
          currentFacing: DUNGEON_CANONICAL_FACING,
          connectionWorldDirection: worldDirection,
        });
    return [{ ...route, direction, worldDirection }];
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
