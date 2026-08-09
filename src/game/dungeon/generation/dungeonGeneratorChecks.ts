import { createInitialRoomProgress, completeRoomEvent } from "../dungeonRoomProgress";
import { resolveRoomEntry } from "../RoomEventController";
import { calculateQuestionRoomPlan, generateDungeon } from "./DungeonGenerator";
import {
  FLOOR1_GENERATION_CONFIG,
  FLOOR1_MAP_TEMPLATES,
  FLOOR1_QUESTION_SET_POOL,
} from "./mapTemplates";
import { createSeededRandom } from "./seededRandom";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[dungeonGeneratorChecks] ${message}`);
}

function generate(seed: string) {
  return generateDungeon({
    templates: FLOOR1_MAP_TEMPLATES,
    config: FLOOR1_GENERATION_CONFIG,
    seed,
    questionSetPool: FLOOR1_QUESTION_SET_POOL,
  });
}

export function runDungeonGeneratorChecks(): void {
  for (const questionCount of [10, 11, 12, 13, 14]) {
    const plan = calculateQuestionRoomPlan(questionCount, 6);
    check(Boolean(plan), `${questionCount} questions must have a room plan`);
    check(
      Boolean(plan && plan.combat * 2 + plan.elite * 3 + plan.event === questionCount),
      `${questionCount} question plan must use the exact budget`,
    );
  }
  const first = generate("generator-check");
  const repeated = generate("generator-check");
  check(first.success && repeated.success, "valid floor 1 generation must succeed");
  if (!first.success || !repeated.success) return;
  check(
    JSON.stringify(first.dungeon) === JSON.stringify(repeated.dungeon),
    "same inputs must produce the same dungeon",
  );
  const different = generate("different-generator-check");
  check(
    different.success &&
      JSON.stringify(different.dungeon) !== JSON.stringify(first.dungeon),
    "different seed should change a supported layout",
  );
  for (const questionCount of [10, 11, 12, 13, 14]) {
    const result = generateDungeon({
      templates: FLOOR1_MAP_TEMPLATES,
      config: {
        ...FLOOR1_GENERATION_CONFIG,
        questionCount,
        questionBudget: { min: questionCount, max: questionCount },
        maximumRoomCounts: {
          ...FLOOR1_GENERATION_CONFIG.maximumRoomCounts,
          elite: Number.POSITIVE_INFINITY,
        },
      },
      seed: `generalized-${questionCount}`,
      questionSetPool: FLOOR1_QUESTION_SET_POOL,
    });
    check(result.success, `${questionCount} question generation must succeed`);
    if (result.success) {
      check(
        result.dungeon.metadata.questionBudgetUsed === questionCount,
        `${questionCount} question dungeon must use the exact budget`,
      );
    }
  }
  const rooms = first.dungeon.rooms;
  check(rooms.filter((room) => room.type === "start").length === 1, "one start");
  check(rooms.filter((room) => room.type === "quest").length === 1, "one final");
  check(rooms.some((room) => room.type === "combat"), "normal combat required");
  check(
    rooms.some((room) => room.type === "treasure" || room.type === "trap"),
    "treasure or trap required",
  );
  check(new Set(rooms.map((room) => room.id)).size === rooms.length, "unique rooms");
  check(
    new Set(first.dungeon.connections.map((connection) => connection.id)).size ===
      first.dungeon.connections.length,
    "unique connections",
  );
  const eventRoom = rooms.find((room) =>
    ["combat", "elite", "treasure", "trap"].includes(room.type));
  check(Boolean(eventRoom), "event room required");
  if (eventRoom) {
    const initial = createInitialRoomProgress(first.dungeon);
    const completed = completeRoomEvent(initial, eventRoom.id);
    check(
      !["startCombat", "startEliteCombat", "startTrap"].includes(
        resolveRoomEntry(eventRoom, completed[eventRoom.id]).type,
      ),
      "completed generated event must not repeat",
    );
    const reset = createInitialRoomProgress(first.dungeon);
    check(!reset[eventRoom.id].eventCompleted, "retry reset must reactivate events");
  }
  const impossible = generateDungeon({
    templates: FLOOR1_MAP_TEMPLATES,
    config: {
      ...FLOOR1_GENERATION_CONFIG,
      questionBudget: { min: 99, max: 100 },
      maxGenerationAttempts: 2,
    },
    seed: "impossible",
    questionSetPool: FLOOR1_QUESTION_SET_POOL,
  });
  check(!impossible.success, "attempt limit must return safe failure");
  const brokenFirstTemplate = {
    ...FLOOR1_MAP_TEMPLATES[0],
    connectionCandidates: FLOOR1_MAP_TEMPLATES[0].connectionCandidates.filter(
      (connection) => connection.toSlotId !== "final",
    ),
  };
  let retrySeed = "retry-0";
  for (let index = 0; index < 100; index += 1) {
    const candidate = `retry-${index}`;
    if (createSeededRandom(candidate).next() < 0.5) {
      retrySeed = candidate;
      break;
    }
  }
  const retried = generateDungeon({
    templates: [brokenFirstTemplate, FLOOR1_MAP_TEMPLATES[1]],
    config: FLOOR1_GENERATION_CONFIG,
    seed: retrySeed,
    questionSetPool: FLOOR1_QUESTION_SET_POOL,
  });
  check(
    retried.success && retried.dungeon.metadata.generationAttempt >= 1,
    "failed first attempt must retry deterministically",
  );
  console.info("dungeon generator checks: PASS");
}
