import type {
  DungeonCameraPose,
  DungeonConnection,
  DungeonFacing,
  DungeonRoomNode,
  DungeonRoomType,
  DungeonVector3,
} from "../dungeonTypes";
import {
  chooseSeeded,
  createSeededRandom,
  deriveAttemptSeed,
} from "./seededRandom";
import { validateDungeon } from "./DungeonValidator";
import type {
  DungeonGenerationInput,
  DungeonGenerationResult,
  DungeonValidationError,
  DungeonQuestionSetPool,
  GeneratedDungeon,
  MapTemplate,
  MapTemplateConnectionCandidate,
  MapTemplateRoomSlot,
} from "./dungeonGenerationTypes";

const CAMERA_Y = 0.2;

function facingFor(slot: MapTemplateRoomSlot): DungeonFacing {
  if (slot.position.x < 0) return "west";
  if (slot.position.x > 0) return "east";
  return "north";
}

function cameraPose(
  slot: MapTemplateRoomSlot,
  facing: DungeonFacing,
): DungeonCameraPose {
  const { x, z } = slot.position;
  if (facing === "west") {
    return { position: [x + 3.8, CAMERA_Y, z], lookAt: [x - 4, -0.15, z] };
  }
  if (facing === "east") {
    return { position: [x - 3.8, CAMERA_Y, z], lookAt: [x + 4, -0.15, z] };
  }
  return { position: [x, CAMERA_Y, z + 3.8], lookAt: [x, -0.15, z - 4] };
}

function lerp(from: DungeonVector3, to: DungeonVector3, amount: number): DungeonVector3 {
  return [
    from[0] + (to[0] - from[0]) * amount,
    CAMERA_Y,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

function createCameraPath(
  source: DungeonRoomNode,
  target: DungeonRoomNode,
  candidate: MapTemplateConnectionCandidate,
): DungeonConnection["cameraPath"] {
  const from = source.explorationCameraPose.position;
  const to = target.explorationCameraPose.position;
  const hasTurn = source.position.x !== target.position.x &&
    source.position.z !== target.position.z;
  return [
    { kind: "roomExit", position: lerp(from, to, 0.2) },
    ...(hasTurn || candidate.cameraPathTemplateId !== "straight"
      ? [{ kind: "junction" as const, position: lerp(from, to, 0.42) }]
      : []),
    { kind: "corridor", position: lerp(from, to, 0.55) },
    { kind: "roomEntrance", position: lerp(from, to, 0.82) },
    {
      kind: "roomCenter",
      position: target.explorationCameraPose.position,
      lookAt: target.explorationCameraPose.lookAt,
    },
  ];
}

function takeTypeSlot(
  slots: MapTemplateRoomSlot[],
  type: DungeonRoomType,
  random: ReturnType<typeof createSeededRandom>,
): MapTemplateRoomSlot {
  const candidates = slots.filter((slot) => slot.allowedRoomTypes.includes(type));
  const selected = chooseSeeded(candidates, random);
  slots.splice(slots.indexOf(selected), 1);
  return selected;
}

function chooseQuestionSet(
  type: DungeonRoomType,
  pools: DungeonQuestionSetPool,
  random: ReturnType<typeof createSeededRandom>,
  used: Set<string>,
): string | undefined {
  const pool =
    type === "combat" ? pools.normalCombat :
      type === "elite" ? pools.eliteCombat :
        type === "treasure" ? pools.treasure :
          type === "trap" ? pools.trap : [];
  if (pool.length === 0) return undefined;
  const unused = pool.filter((id) => !used.has(id));
  const selected = chooseSeeded(unused.length ? unused : pool, random);
  used.add(selected);
  return selected;
}

function createRoom(
  slot: MapTemplateRoomSlot,
  type: DungeonRoomType,
  pools: DungeonQuestionSetPool,
  random: ReturnType<typeof createSeededRandom>,
  usedQuestionSets: Set<string>,
): DungeonRoomNode {
  const facing = facingFor(slot);
  const explorationCameraPose = cameraPose(slot, facing);
  const room: DungeonRoomNode = {
    id: `room-${slot.id}`,
    type,
    position: slot.position,
    facing,
    explorationCameraPose,
    isRequired: slot.required === true,
    isFinalQuestRoom: type === "quest",
  };
  const questionSetId = chooseQuestionSet(type, pools, random, usedQuestionSets);
  if (type === "combat" && questionSetId) {
    room.combatConfig = {
      monsterId: "garlic-king",
      questionSetId,
      monsterPosition: explorationCameraPose.lookAt,
      combatCameraPose: explorationCameraPose,
    };
  } else if (type === "elite" && questionSetId) {
    room.eliteConfig = {
      monsterId: "floor1-elite",
      questionSetId,
      attackDamage: 8,
      monsterPosition: explorationCameraPose.lookAt,
      combatCameraPose: explorationCameraPose,
    };
  } else if (type === "treasure" && questionSetId) {
    room.eventConfig = {
      treasureId: "test-treasure-chest",
      questionSetId,
      rewardId: "old-key",
    };
  } else if (type === "trap" && questionSetId) {
    room.eventConfig = { questionSetId, damage: 10 };
  }
  return room;
}

function generateAttempt(
  template: MapTemplate,
  input: DungeonGenerationInput,
  attemptSeed: string,
  attempt: number,
): GeneratedDungeon {
  const random = createSeededRandom(attemptSeed);
  const assignments = new Map<string, DungeonRoomType>();
  const remaining = template.slots.filter((slot) => !slot.fixedRoomType);
  for (const slot of template.slots) {
    if (slot.fixedRoomType) assignments.set(slot.id, slot.fixedRoomType);
  }

  const eliteSlot = takeTypeSlot(remaining, "elite", random);
  assignments.set(eliteSlot.id, "elite");
  const combatSlot = takeTypeSlot(remaining, "combat", random);
  assignments.set(combatSlot.id, "combat");
  const purposeType = random.next() < 0.5 ? "treasure" : "trap";
  const purposeSlot = takeTypeSlot(remaining, purposeType, random);
  assignments.set(purposeSlot.id, purposeType);

  let combatCount = 1;
  for (const slot of remaining) {
    const allowedFill = slot.allowedRoomTypes.filter(
      (type) => type === "empty" || type === "combat",
    );
    const type = allowedFill.includes("combat") &&
      combatCount < input.questionSetPool.normalCombat.length &&
      random.next() < 0.35
      ? "combat"
      : allowedFill.includes("empty") ? "empty" : allowedFill[0];
    if (type === "combat") combatCount += 1;
    assignments.set(slot.id, type ?? "empty");
  }

  const usedQuestionSets = new Set<string>();
  const rooms = template.slots.map((slot) =>
    createRoom(
      slot,
      assignments.get(slot.id) ?? "empty",
      input.questionSetPool,
      random,
      usedQuestionSets,
    ),
  );
  const roomBySlot = new Map(
    template.slots.map((slot, index) => [slot.id, rooms[index]]),
  );
  const selectedConnections = template.connectionCandidates.filter(
    (candidate) =>
      candidate.required ||
      random.next() < (candidate.optionalWeight ?? 0),
  );
  const connections = selectedConnections.map((candidate) => {
    const source = roomBySlot.get(candidate.fromSlotId)!;
    const target = roomBySlot.get(candidate.toSlotId)!;
    return {
      id: `connection-${candidate.id}`,
      fromRoomId: source.id,
      toRoomId: target.id,
      directionFromSource: candidate.directionFrom,
      directionFromTarget: candidate.directionTo,
      cameraPath: createCameraPath(source, target, candidate),
    };
  });
  const startRoomId = rooms.find((room) => room.type === "start")!.id;
  const finalQuestRoomId = rooms.find((room) => room.type === "quest")!.id;
  return {
    generationId: `${template.id}:${attemptSeed}`,
    floorId: input.config.floorId,
    templateId: template.id,
    seed: String(input.seed),
    rooms,
    connections,
    startRoomId,
    finalQuestRoomId,
    source: "generated",
    metadata: {
      roomCount: rooms.length,
      deadEndCount: 0,
      cycleCount: 0,
      questionBudgetUsed: 0,
      generationAttempt: attempt,
    },
  };
}

export function generateDungeon(
  input: DungeonGenerationInput,
): DungeonGenerationResult {
  if (input.templates.length === 0) {
    return {
      success: false,
      reason: "generationAttemptsExceeded",
      validationErrors: [{ code: "roomCountOutOfRange", detail: "no templates" }],
    };
  }
  let lastErrors: DungeonValidationError[] = [];
  const templateOffset = createSeededRandom(input.seed).next();
  const startTemplateIndex = Math.floor(templateOffset * input.templates.length);
  for (let attempt = 0; attempt < input.config.maxGenerationAttempts; attempt += 1) {
    const template =
      input.templates[(startTemplateIndex + attempt) % input.templates.length];
    const attemptSeed = deriveAttemptSeed(input.seed, attempt, template.id);
    const dungeon = generateAttempt(template, input, attemptSeed, attempt);
    const validation = validateDungeon({ dungeon, template, config: input.config });
    if (validation.valid) {
      dungeon.metadata = {
        ...dungeon.metadata,
        deadEndCount: validation.metrics.deadEndCount,
        cycleCount: validation.metrics.cycleCount,
        questionBudgetUsed: validation.metrics.questionBudgetUsed,
      };
      return { success: true, dungeon };
    }
    lastErrors = validation.errors;
  }
  return {
    success: false,
    reason: "generationAttemptsExceeded",
    validationErrors: lastErrors,
  };
}
