import {
  completeRoomEvent,
  completeRoomEventWithResult,
  createInitialRoomProgress,
  shouldCompleteCombatRoom,
} from "./dungeonRoomProgress";
import { resolveRoomEntry } from "./RoomEventController";
import { getDungeonReward } from "./dungeonEventData";
import { getDungeonQuestionSet } from "./dungeonQuestionSets";
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
  const treasureRooms = TEST_DUNGEON_MAP.rooms.filter(
    (room) => room.type === "treasure",
  );
  const trapRooms = TEST_DUNGEON_MAP.rooms.filter((room) => room.type === "trap");
  check(treasureRooms.length <= 1, "at most one treasure room is allowed");
  check(trapRooms.length <= 1, "at most one trap room is allowed");
  check(treasureRooms.length === 1, "test map needs one treasure room");
  check(trapRooms.length === 1, "test map needs one trap room");
  for (const room of treasureRooms) {
    check(Boolean(room.eventConfig), "treasure room needs eventConfig");
    check(
      Boolean(room.eventConfig && "treasureId" in room.eventConfig),
      "treasure room needs treasureId",
    );
    check(
      getDungeonQuestionSet(room.eventConfig!.questionSetId, 1).length === 1,
      "treasure question set must contain exactly one question",
    );
    check(
      Boolean(
        room.eventConfig &&
          "rewardId" in room.eventConfig &&
          getDungeonReward(room.eventConfig.rewardId),
      ),
      "treasure reward must exist",
    );
  }
  for (const room of trapRooms) {
    check(Boolean(room.eventConfig), "trap room needs eventConfig");
    check(
      Boolean(room.eventConfig && "damage" in room.eventConfig),
      "trap room needs damage",
    );
    check(
      Boolean(
        room.eventConfig &&
          "damage" in room.eventConfig &&
          room.eventConfig.damage >= 0,
      ),
      "trap damage must be zero or greater",
    );
    check(
      getDungeonQuestionSet(room.eventConfig!.questionSetId, 1).length === 1,
      "trap question set must contain exactly one question",
    );
  }
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
  const treasureRoom = treasureRooms[0];
  check(
    resolveRoomEntry(treasureRoom, initial[treasureRoom.id]).type ===
      "showTreasure",
    "treasure entry must wait for investigation",
  );
  const openedTreasure = completeRoomEventWithResult(
    initial,
    treasureRoom.id,
    "treasureOpened",
  );
  check(
    openedTreasure[treasureRoom.id].eventCompleted &&
      openedTreasure[treasureRoom.id].eventResult === "treasureOpened",
    "treasure result must complete once",
  );
  const trapRoom = trapRooms[0];
  check(
    resolveRoomEntry(trapRoom, initial[trapRoom.id]).type === "startTrap",
    "incomplete trap must start automatically",
  );
  const triggeredTrap = completeRoomEventWithResult(
    initial,
    trapRoom.id,
    "trapTriggered",
  );
  check(
    resolveRoomEntry(trapRoom, triggeredTrap[trapRoom.id]).type === "explore",
    "completed trap must not restart",
  );
  check(
    !reset[treasureRoom.id].eventCompleted &&
      !reset[trapRoom.id].eventCompleted,
    "reset must restore treasure and trap events",
  );
  console.info("dungeon map checks: PASS");
}
