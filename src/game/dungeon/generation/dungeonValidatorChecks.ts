import type { DungeonMapDefinition } from "../dungeonTypes";
import { generateDungeon } from "./DungeonGenerator";
import { validateDungeon } from "./DungeonValidator";
import {
  FLOOR1_GENERATION_CONFIG,
  FLOOR1_MAP_TEMPLATES,
  FLOOR1_QUESTION_SET_POOL,
} from "./mapTemplates";
import type { DungeonValidationErrorCode, GeneratedDungeon } from "./dungeonGenerationTypes";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[dungeonValidatorChecks] ${message}`);
}

function hasError(map: DungeonMapDefinition & { finalQuestRoomId?: string }, code: DungeonValidationErrorCode) {
  return validateDungeon({ dungeon: map, config: FLOOR1_GENERATION_CONFIG })
    .errors.some((error) => error.code === code);
}

function clone(dungeon: GeneratedDungeon): GeneratedDungeon {
  return structuredClone(dungeon);
}

export function runDungeonValidatorChecks(): void {
  const result = generateDungeon({
    templates: FLOOR1_MAP_TEMPLATES,
    config: FLOOR1_GENERATION_CONFIG,
    seed: "validator-check",
    questionSetPool: FLOOR1_QUESTION_SET_POOL,
  });
  check(result.success, "fixture generation");
  if (!result.success) return;
  check(
    validateDungeon({ dungeon: result.dungeon, config: FLOOR1_GENERATION_CONFIG }).valid,
    "generated fixture must validate",
  );
  const noStart = clone(result.dungeon);
  noStart.rooms = noStart.rooms.filter((room) => room.type !== "start");
  check(hasError(noStart, "missingStartRoom"), "missing start");
  const noFinal = clone(result.dungeon);
  noFinal.rooms = noFinal.rooms.filter((room) => room.type !== "quest");
  check(hasError(noFinal, "missingFinalQuestRoom"), "missing final");
  const noCombat = clone(result.dungeon);
  noCombat.rooms.forEach((room) => {
    if (room.type === "combat") {
      room.type = "empty";
      delete room.combatConfig;
    }
  });
  check(hasError(noCombat, "missingNormalCombat"), "missing combat");
  const noPurpose = clone(result.dungeon);
  noPurpose.rooms.forEach((room) => {
    if (room.type === "treasure" || room.type === "trap") {
      room.type = "empty";
      delete room.eventConfig;
    }
  });
  check(hasError(noPurpose, "missingTreasureOrTrap"), "missing purpose event");
  const invalidConnection = clone(result.dungeon);
  invalidConnection.connections[0].toRoomId = "missing-room";
  check(hasError(invalidConnection, "invalidConnectionTarget"), "invalid target");
  const self = clone(result.dungeon);
  self.connections[0].toRoomId = self.connections[0].fromRoomId;
  check(hasError(self, "selfConnection"), "self link");
  const unreachable = clone(result.dungeon);
  unreachable.connections = unreachable.connections.filter(
    (connection) => connection.toRoomId !== unreachable.finalQuestRoomId &&
      connection.fromRoomId !== unreachable.finalQuestRoomId,
  );
  check(hasError(unreachable, "finalRoomUnreachable"), "unreachable final");
  check(hasError(unreachable, "requiredRoomUnreachable"), "isolated required room");
  const direct = clone(result.dungeon);
  direct.connections.push({
    id: "direct-final",
    fromRoomId: direct.startRoomId,
    toRoomId: direct.finalQuestRoomId,
    directionFromSource: "forward",
    directionFromTarget: "back",
    cameraPath: [
      { kind: "roomExit", position: [0, 0.2, -1] },
      { kind: "roomEntrance", position: [0, 0.2, -2] },
    ],
  });
  check(hasError(direct, "finalRoomTooClose"), "direct final");
  const treasureSource = result.dungeon.rooms.find((room) => room.type === "treasure");
  const trapSource = result.dungeon.rooms.find((room) => room.type === "trap");
  const purposeSource = treasureSource ?? trapSource;
  check(Boolean(purposeSource), "purpose fixture");
  if (purposeSource) {
    const duplicatePurpose = clone(result.dungeon);
    const target = duplicatePurpose.rooms.find((room) => room.type === "empty")!;
    target.type = purposeSource.type;
    target.eventConfig = structuredClone(purposeSource.eventConfig);
    check(
      hasError(
        duplicatePurpose,
        purposeSource.type === "treasure"
          ? "tooManyTreasureRooms"
          : "tooManyTrapRooms",
      ),
      "purpose maximum",
    );
  }
  const invalidQuestion = clone(result.dungeon);
  const questionRoom = invalidQuestion.rooms.find((room) => room.type === "combat")!;
  questionRoom.combatConfig!.questionSetId = "missing-question-set";
  check(hasError(invalidQuestion, "invalidQuestionSetReference"), "question reference");
  const invalidMonster = clone(result.dungeon);
  invalidMonster.rooms.find((room) => room.type === "elite")!
    .eliteConfig!.monsterId = "missing-monster";
  check(hasError(invalidMonster, "invalidMonsterReference"), "monster reference");
  const invalidEvent = clone(result.dungeon);
  const eventRoom = invalidEvent.rooms.find(
    (room) => room.type === "treasure" || room.type === "trap",
  )!;
  delete eventRoom.eventConfig;
  check(hasError(invalidEvent, "invalidEventConfig"), "event config");
  const strictDeadEnds = {
    ...FLOOR1_GENERATION_CONFIG,
    maxDeadEnds: 0,
    maxNonPurposeDeadEnds: 0,
  };
  check(
    validateDungeon({ dungeon: result.dungeon, config: strictDeadEnds })
      .errors.some((error) => error.code === "tooManyDeadEnds"),
    "dead end limit",
  );
  const excessiveCycle = clone(result.dungeon);
  const pairs = [
    [excessiveCycle.rooms[0].id, excessiveCycle.rooms[2].id],
    [excessiveCycle.rooms[0].id, excessiveCycle.rooms[3].id],
  ];
  pairs.forEach(([fromRoomId, toRoomId], index) => {
    excessiveCycle.connections.push({
      id: `extra-cycle-${index}`,
      fromRoomId,
      toRoomId,
      directionFromSource: "right",
      directionFromTarget: "back",
      cameraPath: [
        { kind: "roomExit", position: [0, 0.2, -1] },
        { kind: "roomEntrance", position: [1, 0.2, -1] },
      ],
    });
  });
  check(hasError(excessiveCycle, "tooManyCycles"), "cycle limit");
  const budgetConfig = {
    ...FLOOR1_GENERATION_CONFIG,
    questionBudget: { min: 0, max: 1 },
  };
  check(
    validateDungeon({ dungeon: result.dungeon, config: budgetConfig })
      .errors.some((error) => error.code === "questionBudgetExceeded"),
    "budget exceeded",
  );
  console.info("dungeon validator checks: PASS");
}
