import { DUNGEON_REWARDS } from "../dungeonEventData";
import { DUNGEON_QUESTION_SETS } from "../dungeonQuestionSets";
import type { DungeonRoomNode, DungeonRoomType } from "../dungeonTypes";
import {
  countComponents,
  countCycles,
  createAdjacency,
  distancesFrom,
  isPurposeDeadEnd,
} from "./dungeonGraphMetrics";
import type {
  DungeonValidationError,
  DungeonValidationInput,
  DungeonValidationResult,
} from "./dungeonGenerationTypes";

const expectedQuestionCount: Partial<Record<DungeonRoomType, number>> = {
  combat: 2,
  elite: 3,
  treasure: 1,
  trap: 1,
};
const VALID_DUNGEON_MONSTER_IDS = new Set(["garlic-king", "floor1-elite"]);

function questionSetId(room: DungeonRoomNode): string | undefined {
  if (room.type === "combat") return room.combatConfig?.questionSetId;
  if (room.type === "elite") return room.eliteConfig?.questionSetId;
  if (room.type === "treasure" || room.type === "trap") {
    return room.eventConfig?.questionSetId;
  }
  return undefined;
}

export function calculateQuestionBudget(rooms: readonly DungeonRoomNode[]): number {
  return rooms.reduce((total, room) => {
    const setId = questionSetId(room);
    return total + (setId ? DUNGEON_QUESTION_SETS[setId]?.length ?? 0 : 0);
  }, 0);
}

export function validateDungeon({
  dungeon,
  config,
}: DungeonValidationInput): DungeonValidationResult {
  const errors: DungeonValidationError[] = [];
  const add = (
    code: DungeonValidationError["code"],
    details: Omit<DungeonValidationError, "code"> = {},
  ) => errors.push({ code, ...details });
  const roomIds = dungeon.rooms.map((room) => room.id);
  const roomIdSet = new Set(roomIds);
  const duplicateRooms = roomIds.filter((id, index) => roomIds.indexOf(id) !== index);
  if (duplicateRooms.length) add("duplicateRoomId", { roomId: duplicateRooms[0] });
  const connectionIds = dungeon.connections.map((item) => item.id);
  if (new Set(connectionIds).size !== connectionIds.length) add("duplicateConnectionId");

  const starts = dungeon.rooms.filter((room) => room.type === "start");
  if (starts.length === 0) add("missingStartRoom");
  if (starts.length > 1) add("multipleStartRooms");
  const finals = dungeon.rooms.filter(
    (room) => room.type === "quest" || room.isFinalQuestRoom,
  );
  if (finals.length === 0) add("missingFinalQuestRoom");
  if (finals.length > 1) add("multipleFinalQuestRooms");
  if (dungeon.rooms.length < config.minRoomCount ||
      dungeon.rooms.length > config.maxRoomCount) add("roomCountOutOfRange");

  const pairs = new Set<string>();
  for (const connection of dungeon.connections) {
    if (!roomIdSet.has(connection.fromRoomId) ||
        !roomIdSet.has(connection.toRoomId)) {
      add("invalidConnectionTarget", { connectionId: connection.id });
    }
    if (connection.fromRoomId === connection.toRoomId) {
      add("selfConnection", { connectionId: connection.id });
    }
    const pair = [connection.fromRoomId, connection.toRoomId].sort().join("::");
    if (pairs.has(pair)) add("duplicateRoomConnection", { connectionId: connection.id });
    pairs.add(pair);
    if (
      connection.cameraPath.length < 2 ||
      !connection.cameraPath.some((point) => point.kind === "roomExit") ||
      !connection.cameraPath.some((point) => point.kind === "roomEntrance")
    ) {
      add("invalidCameraPath", { connectionId: connection.id });
    }
  }

  const adjacency = createAdjacency(dungeon.rooms, dungeon.connections);
  const startId = starts[0]?.id ?? dungeon.startRoomId;
  const distances = distancesFrom(startId, adjacency);
  const final = finals[0];
  const shortestPathToFinal = final ? distances.get(final.id) ?? null : null;
  if (final && shortestPathToFinal === null) add("finalRoomUnreachable", { roomId: final.id });
  if (shortestPathToFinal !== null &&
      shortestPathToFinal < config.minFinalRoomDistance) add("finalRoomTooClose");
  for (const room of dungeon.rooms.filter((candidate) => candidate.isRequired)) {
    if (!distances.has(room.id)) add("requiredRoomUnreachable", { roomId: room.id });
  }
  if (distances.size !== dungeon.rooms.length) add("isolatedComponent");

  const count = (type: DungeonRoomType) =>
    dungeon.rooms.filter((room) => room.type === type).length;
  if (count("combat") < (config.requiredRoomCounts.combat ?? 1)) add("missingNormalCombat");
  if (config.requireTreasureOrTrap && count("treasure") + count("trap") === 0) {
    add("missingTreasureOrTrap");
  }
  if (count("treasure") > (config.maximumRoomCounts.treasure ?? Infinity)) {
    add("tooManyTreasureRooms");
  }
  if (count("trap") > (config.maximumRoomCounts.trap ?? Infinity)) {
    add("tooManyTrapRooms");
  }

  for (const room of dungeon.rooms) {
    const setId = questionSetId(room);
    const expected = expectedQuestionCount[room.type];
    if (expected !== undefined &&
        (!setId || !DUNGEON_QUESTION_SETS[setId] ||
          DUNGEON_QUESTION_SETS[setId].length !== expected)) {
      add("invalidQuestionSetReference", { roomId: room.id, detail: setId });
    }
    const monsterId = room.type === "elite"
      ? room.eliteConfig?.monsterId
      : room.type === "combat"
        ? room.combatConfig?.monsterId
        : undefined;
    if ((room.type === "combat" || room.type === "elite") &&
        (!monsterId || !VALID_DUNGEON_MONSTER_IDS.has(monsterId))) {
      add("invalidMonsterReference", { roomId: room.id, detail: monsterId });
    }
    if (room.type === "treasure") {
      if (!room.eventConfig ||
          !("rewardId" in room.eventConfig) ||
          !DUNGEON_REWARDS[room.eventConfig.rewardId]) {
        add("invalidEventConfig", { roomId: room.id });
      }
    }
    if (room.type === "trap" &&
        (!room.eventConfig || !("damage" in room.eventConfig))) {
      add("invalidEventConfig", { roomId: room.id });
    }
  }

  const questionBudgetUsed = calculateQuestionBudget(dungeon.rooms);
  if (questionBudgetUsed < config.questionBudget.min) add("questionBudgetBelowMinimum");
  if (questionBudgetUsed > config.questionBudget.max) add("questionBudgetExceeded");
  const deadEnds = dungeon.rooms.filter(
    (room) => room.type !== "start" && (adjacency.get(room.id)?.size ?? 0) === 1,
  );
  const nonPurposeDeadEndCount = deadEnds.filter((room) => !isPurposeDeadEnd(room)).length;
  if (deadEnds.length > config.maxDeadEnds) add("tooManyDeadEnds");
  if (nonPurposeDeadEndCount > config.maxNonPurposeDeadEnds) {
    add("tooManyNonPurposeDeadEnds");
  }
  const componentCount = countComponents(adjacency);
  const cycleCount = countCycles(
    dungeon.rooms.length,
    dungeon.connections.length,
    componentCount,
  );
  if (cycleCount > config.maxCycleCount) add("tooManyCycles");

  return {
    valid: errors.length === 0,
    errors,
    metrics: {
      roomCount: dungeon.rooms.length,
      reachableRoomCount: distances.size,
      shortestPathToFinal,
      deadEndCount: deadEnds.length,
      nonPurposeDeadEndCount,
      cycleCount,
      questionBudgetUsed,
    },
  };
}
