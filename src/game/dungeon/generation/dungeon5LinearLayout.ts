import type { DungeonCameraPathPoint, DungeonMapDefinition, DungeonRoomNode, DungeonVector3 } from "../dungeonTypes";

const ROOM_SPACING = 16;
const CAMERA_Y = 0.5;

function pointBetween(from: DungeonVector3, to: DungeonVector3, amount: number): DungeonVector3 {
  return [from[0] + (to[0] - from[0]) * amount, CAMERA_Y, from[2] + (to[2] - from[2]) * amount];
}

function relocateRoom(room: DungeonRoomNode, index: number): DungeonRoomNode {
  const z = -index * ROOM_SPACING;
  const pose = {
    position: [0, CAMERA_Y, z] as DungeonVector3,
    lookAt: [0, -0.15, z - 4] as DungeonVector3,
  };
  return {
    ...room,
    position: { x: 0, y: 0, z },
    facing: "north",
    explorationCameraPose: pose,
    combatConfig: room.combatConfig ? { ...room.combatConfig, monsterPosition: pose.lookAt, combatCameraPose: pose } : undefined,
    eliteConfig: room.eliteConfig ? { ...room.eliteConfig, monsterPosition: pose.lookAt, combatCameraPose: pose } : undefined,
  };
}

function straightCameraPath(source: DungeonRoomNode, target: DungeonRoomNode): DungeonCameraPathPoint[] {
  const from = source.explorationCameraPose.position;
  const to = target.explorationCameraPose.position;
  return [
    { kind: "roomExit", position: pointBetween(from, to, 0.2) },
    { kind: "corridor", position: pointBetween(from, to, 0.55) },
    { kind: "roomEntrance", position: pointBetween(from, to, 0.82) },
    { kind: "roomCenter", position: to, lookAt: target.explorationCameraPose.lookAt },
  ];
}

export function createDungeon5LinearLayout(map: DungeonMapDefinition): DungeonMapDefinition {
  const playableRooms = map.rooms.filter((room) => !room.id.startsWith("room-story-"));
  const start = playableRooms.find((room) => room.id === map.startRoomId || room.type === "start");
  const final = playableRooms.find((room) => room.isFinalQuestRoom || room.type === "quest");
  if (!start || !final) return map;
  const middle = playableRooms.filter((room) => room.id !== start.id && room.id !== final.id);
  const rooms = [start, ...middle, final].map(relocateRoom);
  const connections = rooms.slice(0, -1).map((source, index) => {
    const target = rooms[index + 1];
    return {
      id: `connection-floor5-forward-${index + 1}`,
      fromRoomId: source.id,
      toRoomId: target.id,
      directionFromSource: "forward" as const,
      directionFromTarget: "back" as const,
      cameraPath: straightCameraPath(source, target),
    };
  });
  return { startRoomId: start.id, rooms, connections };
}
