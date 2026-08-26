import type { DungeonMapDefinition } from "./dungeonTypes";

export const DUNGEON10_START_ROOM_ID = "dungeon10-start";
export const DUNGEON10_BOSS_ROOM_ID = "dungeon10-boss";

/** Fixed two-room layout. It bypasses random generation without changing the generator. */
export const DUNGEON10_MAP: DungeonMapDefinition = {
  startRoomId: DUNGEON10_START_ROOM_ID,
  rooms: [
    {
      id: DUNGEON10_START_ROOM_ID,
      type: "start",
      position: { x: 0, y: 0, z: 0 },
      facing: "north",
      explorationCameraPose: {
        position: [0, 0, 2],
        lookAt: [0, 0, -8],
        rotationY: 0,
      },
    },
    {
      id: DUNGEON10_BOSS_ROOM_ID,
      type: "empty",
      position: { x: 0, y: 0, z: -48 },
      facing: "north",
      explorationCameraPose: {
        position: [0, 0, -40],
        lookAt: [0, 0, -52],
        rotationY: 0,
      },
    },
  ],
  connections: [
    {
      id: "dungeon10-start-to-boss",
      fromRoomId: DUNGEON10_START_ROOM_ID,
      toRoomId: DUNGEON10_BOSS_ROOM_ID,
      directionFromSource: "forward",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, 0, -6] },
        { kind: "corridor", position: [0, 0, -24] },
        { kind: "roomEntrance", position: [0, 0, -36] },
        { kind: "roomCenter", position: [0, 0, -40], lookAt: [0, 0, -52] },
      ],
    },
  ],
};
