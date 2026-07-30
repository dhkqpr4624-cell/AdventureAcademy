import { TEST_QUESTIONS } from "../../data/testQuestions";
import type { Question } from "../../types/question";
import type { DungeonMapDefinition } from "./dungeonTypes";
import { createSeededRandom, deriveAttemptSeed } from "./generation/seededRandom";

export type DungeonRunQuestionAssignments = Readonly<
  Record<string, readonly Question[]>
>;

function shuffledQuestions(seed: string): Question[] {
  const random = createSeededRandom(seed);
  const result = [...TEST_QUESTIONS];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function allocateDungeonRunQuestions(
  map: DungeonMapDefinition,
  seed: string,
): DungeonRunQuestionAssignments {
  const questionRooms = map.rooms
    .filter((room) =>
      room.type === "combat" ||
      room.type === "elite" ||
      room.type === "treasure" ||
      room.type === "trap"
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  const questionCount = (room: (typeof questionRooms)[number]) =>
    room.type === "elite" ? 3 : room.type === "combat" ? 2 : 1;
  const requiredCount = questionRooms.reduce(
    (sum, room) => sum + questionCount(room),
    0,
  );
  const pool = shuffledQuestions(
    deriveAttemptSeed(seed, 0, "combat-question-allocation"),
  );
  if (requiredCount > pool.length) {
    throw new Error(
      `[dungeonRunQuestionAllocator] Need ${requiredCount} unique questions, but pool contains ${pool.length}`,
    );
  }

  let offset = 0;
  return Object.fromEntries(
    questionRooms.map((room) => {
      const count = questionCount(room);
      const questions = pool.slice(offset, offset + count);
      offset += count;
      return [room.id, questions];
    }),
  );
}
