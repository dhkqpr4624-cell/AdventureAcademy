import { createDungeonRun, createFloor1DungeonRun } from "./generation/floor1DungeonRuntime";
import { allocateDungeonRunQuestions } from "./dungeonRunQuestionAllocator";
import { FLOOR1_PREHISTORY_QUESTIONS, FLOOR2_GOJOSEON_QUESTIONS } from "../../data/testQuestions";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon run question allocator checks] ${message}`);
}

export function runDungeonRunQuestionAllocatorChecks() {
  const run = createFloor1DungeonRun("question-allocation-seed");
  const first = allocateDungeonRunQuestions(run.map, run.seed);
  const repeated = allocateDungeonRunQuestions(run.map, run.seed);
  check(JSON.stringify(first) === JSON.stringify(repeated), "same seed repeats");

  const assigned = Object.values(first).flat();
  check(FLOOR1_PREHISTORY_QUESTIONS.length === 15, "floor 1 pool contains 15 questions");
  check(assigned.length === 10, "one floor 1 run assigns exactly 10 questions");
  check(
    assigned.every((question) => FLOOR1_PREHISTORY_QUESTIONS.some((candidate) => candidate.id === question.id)),
    "floor 1 only assigns prehistory questions",
  );
  check(
    new Set(assigned.map((question) => question.id)).size === assigned.length,
    "questions do not repeat in one dungeon",
  );
  for (const room of run.map.rooms) {
    if (room.type === "combat") check(first[room.id]?.length === 2, "normal combat gets 2");
    if (room.type === "elite") check(first[room.id]?.length === 3, "elite gets 3");
    if (room.type === "treasure") check(first[room.id]?.length === 1, "treasure gets 1");
    if (room.type === "trap") check(first[room.id]?.length === 1, "trap gets 1");
  }

  const different = allocateDungeonRunQuestions(run.map, "different-question-seed");
  check(JSON.stringify(first) !== JSON.stringify(different), "new dungeon reshuffles");

  const floor2Run = createDungeonRun("floor-2", "floor2-question-allocation-seed");
  const floor2RepeatedRun = createDungeonRun("floor-2", "floor2-question-allocation-seed");
  const floor2DifferentRun = createDungeonRun("floor-2", "floor2-different-map-seed");
  check(floor2Run.source === "generated", "floor 2 uses generated dungeon");
  check(
    JSON.stringify(floor2Run.map) === JSON.stringify(floor2RepeatedRun.map),
    "floor 2 same seed reproduces the same dungeon",
  );
  check(
    JSON.stringify(floor2Run.map) !== JSON.stringify(floor2DifferentRun.map),
    "floor 2 different seed changes the dungeon",
  );
  const floor2First = allocateDungeonRunQuestions(floor2Run.map, floor2Run.seed, "floor-2");
  const floor2Repeated = allocateDungeonRunQuestions(floor2Run.map, floor2Run.seed, "floor-2");
  const floor2Assigned = Object.values(floor2First).flat();
  check(FLOOR2_GOJOSEON_QUESTIONS.length === 16, "floor 2 pool contains 16 questions");
  check(floor2Assigned.length === 11, "one floor 2 run assigns exactly 11 questions");
  check(
    floor2Assigned.every((question) => FLOOR2_GOJOSEON_QUESTIONS.some((candidate) => candidate.id === question.id)),
    "floor 2 only assigns its own question pool",
  );
  check(
    new Set(floor2Assigned.map((question) => question.id)).size === 11,
    "floor 2 questions do not repeat in one dungeon",
  );
  check(JSON.stringify(floor2First) === JSON.stringify(floor2Repeated), "floor 2 same seed repeats");
  const floor2Different = allocateDungeonRunQuestions(floor2Run.map, "floor2-different-question-seed", "floor-2");
  check(JSON.stringify(floor2First) !== JSON.stringify(floor2Different), "floor 2 new seed reshuffles");
  console.info("dungeon run question allocator checks: PASS");
}
