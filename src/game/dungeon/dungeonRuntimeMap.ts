import type {
  DungeonCameraPathPoint,
  DungeonMapDefinition,
  DungeonRoomNode,
  TraversableDungeonConnection,
} from "./dungeonTypes";

export function getDungeonRoomFromMap(
  map: DungeonMapDefinition,
  roomId: string,
): DungeonRoomNode {
  const room = map.rooms.find((candidate) => candidate.id === roomId);
  if (!room) {
    throw new Error(`[dungeonRuntimeMap] Unknown dungeon room: ${roomId}`);
  }
  return room;
}

function reversePath(
  destination: DungeonRoomNode,
  cameraPath: DungeonCameraPathPoint[],
): DungeonCameraPathPoint[] {
  const reversed = cameraPath.slice(0, -1).reverse().map((point) => ({
    ...point,
    kind:
      point.kind === "roomExit"
        ? "roomEntrance" as const
        : point.kind === "roomEntrance"
          ? "roomExit" as const
          : point.kind,
    rotationY: undefined,
    lookAt: undefined,
  }));
  return [
    ...reversed,
    {
      kind: "roomCenter",
      position: destination.explorationCameraPose.position,
      lookAt: destination.explorationCameraPose.lookAt,
    },
  ];
}

export function getConnectionsForRoomFromMap(
  map: DungeonMapDefinition,
  roomId: string,
): TraversableDungeonConnection[] {
  return map.connections.flatMap((connection) => {
    if (connection.fromRoomId === roomId) {
      return [{
        connection,
        targetRoomId: connection.toRoomId,
        direction: connection.directionFromSource,
        cameraPath: connection.cameraPath,
      }];
    }
    if (connection.toRoomId === roomId) {
      return [{
        connection,
        targetRoomId: connection.fromRoomId,
        direction: connection.directionFromTarget,
        cameraPath: reversePath(
          getDungeonRoomFromMap(map, connection.fromRoomId),
          connection.cameraPath,
        ),
      }];
    }
    return [];
  });
}
