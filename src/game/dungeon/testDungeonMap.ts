import type {
  DungeonCameraPathPoint,
  DungeonMapDefinition,
  DungeonRoomNode,
  TraversableDungeonConnection,
} from "./dungeonTypes";

const PI = Math.PI;

export const TEST_DUNGEON_MAP: DungeonMapDefinition = {
  startRoomId: "room-start",
  rooms: [
    {
      id: "room-start",
      type: "start",
      position: { x: 0, y: 0, z: 0 },
      facing: "north",
      cameraPoint: {
        position: [0, 0.2, 3.8],
        lookAt: [0, -0.15, -4],
        rotationY: 0,
      },
    },
    {
      id: "room-empty-a",
      type: "empty",
      position: { x: 0, y: 0, z: -16 },
      facing: "north",
      cameraPoint: {
        position: [0, 0.2, -12.2],
        lookAt: [0, -0.15, -20],
        rotationY: 0,
      },
    },
    {
      id: "room-combat-a",
      type: "combat",
      position: { x: -16, y: 0, z: -16 },
      facing: "west",
      cameraPoint: {
        position: [-12.2, 0.2, -16],
        lookAt: [-20, -0.15, -16],
        rotationY: -PI / 2,
      },
    },
    {
      id: "room-empty-b",
      type: "empty",
      position: { x: 0, y: 0, z: -32 },
      facing: "north",
      cameraPoint: {
        position: [0, 0.2, -28.2],
        lookAt: [0, -0.15, -36],
        rotationY: 0,
      },
    },
    {
      id: "room-combat-b",
      type: "combat",
      position: { x: 16, y: 0, z: -32 },
      facing: "east",
      cameraPoint: {
        position: [12.2, 0.2, -32],
        lookAt: [20, -0.15, -32],
        rotationY: PI / 2,
      },
    },
  ],
  connections: [
    {
      id: "connection-start-empty-a",
      fromRoomId: "room-start",
      toRoomId: "room-empty-a",
      directionFromSource: "forward",
      directionFromTarget: "back",
      cameraPath: [
        { position: [0, 0.2, -2], rotationY: 0, duration: 260 },
        { position: [0, 0.2, -8], rotationY: 0, duration: 420 },
        { position: [0, 0.2, -12.2], rotationY: 0, duration: 300 },
      ],
    },
    {
      id: "connection-empty-a-combat-a",
      fromRoomId: "room-empty-a",
      toRoomId: "room-combat-a",
      directionFromSource: "left",
      directionFromTarget: "back",
      cameraPath: [
        { position: [-2, 0.2, -16], rotationY: -PI / 4, duration: 300 },
        { position: [-8, 0.2, -16], rotationY: -PI / 2, duration: 420 },
        { position: [-12.2, 0.2, -16], rotationY: -PI / 2, duration: 300 },
      ],
    },
    {
      id: "connection-empty-a-empty-b",
      fromRoomId: "room-empty-a",
      toRoomId: "room-empty-b",
      directionFromSource: "forward",
      directionFromTarget: "back",
      cameraPath: [
        { position: [0, 0.2, -18], rotationY: 0, duration: 260 },
        { position: [0, 0.2, -24], rotationY: 0, duration: 420 },
        { position: [0, 0.2, -28.2], rotationY: 0, duration: 300 },
      ],
    },
    {
      id: "connection-empty-b-combat-b",
      fromRoomId: "room-empty-b",
      toRoomId: "room-combat-b",
      directionFromSource: "right",
      directionFromTarget: "back",
      cameraPath: [
        { position: [2, 0.2, -32], rotationY: PI / 4, duration: 300 },
        { position: [8, 0.2, -32], rotationY: PI / 2, duration: 420 },
        { position: [12.2, 0.2, -32], rotationY: PI / 2, duration: 300 },
      ],
    },
  ],
};

export function getDungeonRoom(roomId: string): DungeonRoomNode {
  const room = TEST_DUNGEON_MAP.rooms.find((candidate) => candidate.id === roomId);
  if (!room) {
    throw new Error(`Unknown dungeon room: ${roomId}`);
  }
  return room;
}

function reversePath(
  destination: DungeonRoomNode,
  cameraPath: DungeonCameraPathPoint[],
): DungeonCameraPathPoint[] {
  const reversed = cameraPath
    .slice(0, -1)
    .reverse()
    .map((point) => ({ ...point }));
  return [
    ...reversed,
    {
      position: destination.cameraPoint.position,
      rotationY: destination.cameraPoint.rotationY,
      duration: 300,
    },
  ];
}

export function getConnectionsForRoom(
  roomId: string,
): TraversableDungeonConnection[] {
  return TEST_DUNGEON_MAP.connections.flatMap((connection) => {
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
          getDungeonRoom(connection.fromRoomId),
          connection.cameraPath,
        ),
      }];
    }
    return [];
  });
}
