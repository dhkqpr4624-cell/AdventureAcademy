import { createFloor1DungeonRun } from "./generation/floor1DungeonRuntime";
import { allocateDungeonRunQuestions } from "./dungeonRunQuestionAllocator";
import { FLOOR1_PREHISTORY_QUESTIONS } from "../../data/testQuestions";

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
  console.info("dungeon run question allocator checks: PASS");
}
