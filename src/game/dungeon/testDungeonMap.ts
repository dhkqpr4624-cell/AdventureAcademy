import type {
  DungeonCameraPathPoint,
  DungeonMapDefinition,
  DungeonRoomNode,
  TraversableDungeonConnection,
} from "./dungeonTypes";

const CAMERA_Y = 0.2;

export const TEST_DUNGEON_MAP: DungeonMapDefinition = {
  startRoomId: "room-start",
  rooms: [
    {
      id: "room-start",
      type: "start",
      position: { x: 0, y: 0, z: 0 },
      facing: "north",
      explorationCameraPose: {
        position: [0, 0.2, 3.8],
        lookAt: [0, -0.15, -4],
      },
    },
    {
      id: "room-empty-a",
      type: "empty",
      position: { x: 0, y: 0, z: -16 },
      facing: "north",
      explorationCameraPose: {
        position: [0, 0.2, -12.2],
        lookAt: [0, -0.15, -20],
      },
    },
    {
      id: "room-combat-a",
      type: "combat",
      position: { x: -16, y: 0, z: -16 },
      facing: "west",
      explorationCameraPose: {
        position: [-12.2, 0.2, -16],
        lookAt: [-20, -0.15, -16],
      },
      combatConfig: {
        monsterId: "garlic-king",
        questionSetId: "normal-garlic-a",
        monsterPosition: [-17.2, 0.05, -16],
        combatCameraPose: {
          position: [-12.2, 0.2, -16],
          lookAt: [-17.2, 0.05, -16],
        },
      },
    },
    {
      id: "room-treasure",
      type: "treasure",
      position: { x: 16, y: 0, z: -16 },
      facing: "east",
      explorationCameraPose: {
        position: [12.2, 0.2, -16],
        lookAt: [20, -0.15, -16],
      },
      eventConfig: {
        treasureId: "test-treasure-chest",
        questionSetId: "treasure-test-a",
        rewardId: "old-key",
      },
    },
    {
      id: "room-empty-b",
      type: "empty",
      position: { x: 0, y: 0, z: -32 },
      facing: "north",
      explorationCameraPose: {
        position: [0, 0.2, -28.2],
        lookAt: [0, -0.15, -36],
      },
    },
    {
      id: "room-combat-b",
      type: "combat",
      position: { x: 16, y: 0, z: -32 },
      facing: "east",
      explorationCameraPose: {
        position: [12.2, 0.2, -32],
        lookAt: [20, -0.15, -32],
      },
      combatConfig: {
        monsterId: "garlic-king",
        questionSetId: "normal-garlic-b",
        monsterPosition: [17.2, 0.05, -32],
        combatCameraPose: {
          position: [12.2, 0.2, -32],
          lookAt: [17.2, 0.05, -32],
        },
      },
    },
    {
      id: "room-trap",
      type: "trap",
      position: { x: -16, y: 0, z: -32 },
      facing: "west",
      explorationCameraPose: {
        position: [-12.2, 0.2, -32],
        lookAt: [-20, -0.15, -32],
      },
      eventConfig: {
        questionSetId: "trap-test-a",
        damage: 10,
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
        { kind: "roomExit", position: [0, CAMERA_Y, 0] },
        { kind: "corridor", position: [0, CAMERA_Y, -5] },
        { kind: "roomEntrance", position: [0, CAMERA_Y, -10] },
        { kind: "roomCenter", position: [0, CAMERA_Y, -12.2] },
      ],
    },
    {
      id: "connection-empty-a-combat-a",
      fromRoomId: "room-empty-a",
      toRoomId: "room-combat-a",
      directionFromSource: "left",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, CAMERA_Y, -15] },
        { kind: "junction", position: [0, CAMERA_Y, -16] },
        { kind: "corridor", position: [-6, CAMERA_Y, -16] },
        { kind: "roomEntrance", position: [-11, CAMERA_Y, -16] },
        { kind: "roomCenter", position: [-12.2, CAMERA_Y, -16] },
      ],
    },
    {
      id: "connection-empty-a-empty-b",
      fromRoomId: "room-empty-a",
      toRoomId: "room-empty-b",
      directionFromSource: "forward",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, CAMERA_Y, -20] },
        { kind: "corridor", position: [0, CAMERA_Y, -24] },
        { kind: "roomEntrance", position: [0, CAMERA_Y, -27] },
        { kind: "roomCenter", position: [0, CAMERA_Y, -28.2] },
      ],
    },
    {
      id: "connection-empty-a-treasure",
      fromRoomId: "room-empty-a",
      toRoomId: "room-treasure",
      directionFromSource: "right",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, CAMERA_Y, -17] },
        { kind: "junction", position: [0, CAMERA_Y, -16] },
        { kind: "corridor", position: [6, CAMERA_Y, -16] },
        { kind: "roomEntrance", position: [11, CAMERA_Y, -16] },
        { kind: "roomCenter", position: [12.2, CAMERA_Y, -16] },
      ],
    },
    {
      id: "connection-empty-b-combat-b",
      fromRoomId: "room-empty-b",
      toRoomId: "room-combat-b",
      directionFromSource: "right",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, CAMERA_Y, -31] },
        { kind: "junction", position: [0, CAMERA_Y, -32] },
        { kind: "corridor", position: [6, CAMERA_Y, -32] },
        { kind: "roomEntrance", position: [11, CAMERA_Y, -32] },
        { kind: "roomCenter", position: [12.2, CAMERA_Y, -32] },
      ],
    },
    {
      id: "connection-empty-b-trap",
      fromRoomId: "room-empty-b",
      toRoomId: "room-trap",
      directionFromSource: "left",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, CAMERA_Y, -33] },
        { kind: "junction", position: [0, CAMERA_Y, -32] },
        { kind: "corridor", position: [-6, CAMERA_Y, -32] },
        { kind: "roomEntrance", position: [-11, CAMERA_Y, -32] },
        { kind: "roomCenter", position: [-12.2, CAMERA_Y, -32] },
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
