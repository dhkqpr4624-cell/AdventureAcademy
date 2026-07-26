import {
  completeRoomEvent,
  createInitialRoomProgress,
  shouldCompleteCombatRoom,
} from "./dungeonRoomProgress";
import { resolveRoomEntry } from "./RoomEventController";
import {
  getConnectionsForRoom,
  getDungeonRoom,
  TEST_DUNGEON_MAP,
} from "./testDungeonMap";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[dungeonMapChecks] ${message}`);
  }
}

export function runDungeonMapChecks(): void {
  const roomIds = TEST_DUNGEON_MAP.rooms.map((room) => room.id);
  const connectionIds = TEST_DUNGEON_MAP.connections.map((item) => item.id);
  const roomIdSet = new Set(roomIds);
  check(roomIdSet.size === roomIds.length, "room IDs must be unique");
  check(
    new Set(connectionIds).size === connectionIds.length,
    "connection IDs must be unique",
  );
  check(
    TEST_DUNGEON_MAP.rooms.filter((room) => room.type === "start").length === 1,
    "exactly one start room is required",
  );
  check(
    TEST_DUNGEON_MAP.rooms.filter((room) => room.type === "combat").length >= 2,
    "at least two combat rooms are required",
  );
  for (const connection of TEST_DUNGEON_MAP.connections) {
    check(roomIdSet.has(connection.fromRoomId), "fromRoomId must exist");
    check(roomIdSet.has(connection.toRoomId), "toRoomId must exist");
    check(connection.fromRoomId !== connection.toRoomId, "self links are invalid");
    check(connection.cameraPath.length >= 4, "cameraPath needs at least 4 points");
    check(
      connection.cameraPath.some((point) => point.kind === "roomExit"),
      "cameraPath needs a room exit",
    );
    check(
      connection.cameraPath.some((point) => point.kind === "roomEntrance"),
      "cameraPath needs a room entrance",
    );
    check(
      getConnectionsForRoom(connection.fromRoomId).some(
        (item) => item.targetRoomId === connection.toRoomId,
      ),
      "forward traversal must exist",
    );
    check(
      getConnectionsForRoom(connection.toRoomId).some(
        (item) => item.targetRoomId === connection.fromRoomId,
      ),
      "reverse traversal must exist",
    );
  }

  const initial = createInitialRoomProgress(TEST_DUNGEON_MAP);
  check(
    Object.values(initial).every((progress) => !progress.eventCompleted),
    "initial room progress must be false",
  );
  for (const outcome of [
    "perfectVictory",
    "hardVictory",
    "enemyEscaped",
  ] as const) {
    check(shouldCompleteCombatRoom(outcome), `${outcome} must complete the room`);
  }
  const combatRoom = getDungeonRoom("room-combat-a");
  check(
    resolveRoomEntry(combatRoom, initial[combatRoom.id]).type === "startCombat",
    "incomplete combat room must start combat",
  );
  const completed = completeRoomEvent(initial, combatRoom.id);
  check(
    resolveRoomEntry(combatRoom, completed[combatRoom.id]).type ===
      "skipCompletedCombat",
    "completed combat room must skip combat",
  );
  const reset = createInitialRoomProgress(TEST_DUNGEON_MAP);
  check(!reset[combatRoom.id].eventCompleted, "reset must restore combat event");
  console.info("dungeon map checks: PASS");
}
