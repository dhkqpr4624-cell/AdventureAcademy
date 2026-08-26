import {
  FLOOR1_PREHISTORY_QUESTIONS,
  FLOOR2_GOJOSEON_QUESTIONS,
  FLOOR3_THREE_KINGDOMS_QUESTIONS,
} from "../../data/testQuestions";
import type { Question } from "../../types/question";
import { createSeededRandom } from "../dungeon/generation/seededRandom";

export const BOSS_QUIZ_QUESTION_COUNT = 15;

const DUNGEON_1_TO_9_QUESTION_POOL: readonly Question[] = [
  ...FLOOR1_PREHISTORY_QUESTIONS,
  ...FLOOR2_GOJOSEON_QUESTIONS,
  ...FLOOR3_THREE_KINGDOMS_QUESTIONS,
];

export function createBossQuizQuestions(seed: string): readonly Question[] {
  const uniqueQuestions = [
    ...new Map(
      DUNGEON_1_TO_9_QUESTION_POOL.map((question) => [question.id, question]),
    ).values(),
  ];
  if (uniqueQuestions.length < BOSS_QUIZ_QUESTION_COUNT) {
    throw new Error(
      `[BossQuizFlow] Need ${BOSS_QUIZ_QUESTION_COUNT} unique questions, but pool contains ${uniqueQuestions.length}`,
    );
  }

  const random = createSeededRandom(`${seed}::dungeon10-boss-quiz`);
  for (let index = uniqueQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    [uniqueQuestions[index], uniqueQuestions[swapIndex]] = [
      uniqueQuestions[swapIndex],
      uniqueQuestions[index],
    ];
  }
  return uniqueQuestions.slice(0, BOSS_QUIZ_QUESTION_COUNT);
}
