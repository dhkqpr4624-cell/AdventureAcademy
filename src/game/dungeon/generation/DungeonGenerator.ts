import type {
  DungeonCameraPose,
  DungeonConnection,
  DungeonFacing,
  DungeonMapDefinition,
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
const QUESTION_COST = { combat: 2, elite: 3, event: 1 } as const;

export type DungeonQuestionRoomPlan = {
  combat: number;
  elite: number;
  event: number;
  roomCount: number;
};

export function calculateQuestionRoomPlan(
  questionCount: number,
  availableSlots = Number.POSITIVE_INFINITY,
): DungeonQuestionRoomPlan | null {
  if (!Number.isInteger(questionCount) || questionCount <= 0) return null;
  let best: DungeonQuestionRoomPlan | null = null;
  for (let event = 1; event <= questionCount; event += 1) {
    for (let elite = 1; elite * QUESTION_COST.elite < questionCount; elite += 1) {
      const remaining = questionCount -
        event * QUESTION_COST.event -
        elite * QUESTION_COST.elite;
      if (remaining < QUESTION_COST.combat || remaining % QUESTION_COST.combat !== 0) {
        continue;
      }
      const combat = remaining / QUESTION_COST.combat;
      const candidate = { combat, elite, event, roomCount: combat + elite + event };
      if (candidate.roomCount > availableSlots) continue;
      if (!best ||
        candidate.event < best.event ||
        (candidate.event === best.event && candidate.elite < best.elite) ||
        (candidate.event === best.event && candidate.elite === best.elite && candidate.roomCount < best.roomCount)) {
        best = candidate;
      }
    }
  }
  return best;
}

export function selectRequiredStoryRoomIds(
  map: Pick<DungeonMapDefinition, "rooms" | "connections" | "startRoomId">,
  requiredCount: number,
  useSingleShortestPath = false,
): string[] {
  if (requiredCount <= 0) return [];
  const eligible = map.rooms.filter((room) => room.id !== map.startRoomId && !room.isFinalQuestRoom);
  const adjacency = new Map(map.rooms.map((room) => [room.id, [] as string[]]));
  for (const connection of map.connections) {
    adjacency.get(connection.fromRoomId)?.push(connection.toRoomId);
    adjacency.get(connection.toRoomId)?.push(connection.fromRoomId);
  }
  const finalRoomId = map.rooms.find((room) => room.isFinalQuestRoom)?.id;
  const mainPathRoomIds = new Set<string>();
  if (useSingleShortestPath) {
    const previous = new Map<string, string>();
    const visited = new Set([map.startRoomId]);
    const queue = [map.startRoomId];
    for (let index = 0; index < queue.length && finalRoomId && !visited.has(finalRoomId); index += 1) {
      const current = queue[index];
      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        previous.set(next, current);
        queue.push(next);
      }
    }
    if (finalRoomId && visited.has(finalRoomId)) {
      for (let current: string | undefined = finalRoomId; current; current = previous.get(current)) {
        mainPathRoomIds.add(current);
        if (current === map.startRoomId) break;
      }
    }
  } else {
    const distancesFrom = (originId: string) => {
      const distances = new Map<string, number>([[originId, 0]]);
      const queue = [originId];
      for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index];
        for (const next of adjacency.get(current) ?? []) {
          if (distances.has(next)) continue;
          distances.set(next, (distances.get(current) ?? 0) + 1);
          queue.push(next);
        }
      }
      return distances;
    };
    const startDistances = distancesFrom(map.startRoomId);
    const finalDistances = finalRoomId ? distancesFrom(finalRoomId) : new Map<string, number>();
    const shortestDistance = finalRoomId ? startDistances.get(finalRoomId) : undefined;
    if (shortestDistance !== undefined) {
      for (const room of map.rooms) {
        if ((startDistances.get(room.id) ?? Infinity) + (finalDistances.get(room.id) ?? Infinity) === shortestDistance) {
          mainPathRoomIds.add(room.id);
        }
      }
    }
  }
  const degree = (roomId: string) => adjacency.get(roomId)?.length ?? 0;
  const branchDeadEnds = eligible.filter((room) => degree(room.id) === 1 && !mainPathRoomIds.has(room.id));
  const otherDeadEnds = eligible.filter((room) => degree(room.id) === 1 && !branchDeadEnds.includes(room));
  const branchRooms = eligible.filter((room) => !mainPathRoomIds.has(room.id) && !branchDeadEnds.includes(room) && !otherDeadEnds.includes(room));
  const mainPathRooms = eligible.filter((room) => mainPathRoomIds.has(room.id) && !otherDeadEnds.includes(room));
  return [...branchDeadEnds, ...otherDeadEnds, ...branchRooms, ...mainPathRooms]
    .filter((room, index, rooms) => rooms.findIndex((candidate) => candidate.id === room.id) === index)
    .slice(0, requiredCount)
    .map((room) => room.id);
}

function facingFor(_slot: MapTemplateRoomSlot): DungeonFacing {
  return "north";
}

function cameraPose(
  slot: MapTemplateRoomSlot,
  facing: DungeonFacing,
): DungeonCameraPose {
  const { x, z } = slot.position;
  void facing;
  return { position: [x, CAMERA_Y, z], lookAt: [x, -0.15, z - 4] };
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
  const plan = calculateQuestionRoomPlan(input.config.questionCount, remaining.length);
  if (plan) {
    const purposeType = random.next() < 0.5 ? "treasure" : "trap";
    for (const type of [
      ...Array<DungeonRoomType>(plan.event).fill(purposeType),
      ...Array<DungeonRoomType>(plan.elite).fill("elite"),
      ...Array<DungeonRoomType>(plan.combat).fill("combat"),
    ]) {
      const slot = takeTypeSlot(remaining, type, random);
      assignments.set(slot.id, type);
    }
  }
  for (const slot of remaining) assignments.set(slot.id, "empty");

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
