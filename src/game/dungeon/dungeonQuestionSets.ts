import { TEST_QUESTIONS } from "../../data/testQuestions";
import type { Question } from "../../types/question";
import type { DungeonMapDefinition } from "./dungeonTypes";

export const DUNGEON_QUESTION_SETS: Readonly<Record<string, readonly Question[]>> = {
  "normal-garlic-a": [TEST_QUESTIONS[0], TEST_QUESTIONS[1]],
  "normal-garlic-b": [TEST_QUESTIONS[2], TEST_QUESTIONS[3]],
};

export function getDungeonQuestionSet(questionSetId: string): readonly Question[] {
  const questions = DUNGEON_QUESTION_SETS[questionSetId];
  if (!questions) {
    throw new Error(`[dungeonQuestionSets] Unknown question set: ${questionSetId}`);
  }
  if (questions.length !== 2) {
    throw new Error(
      `[dungeonQuestionSets] ${questionSetId} must contain exactly 2 questions`,
    );
  }
  return questions;
}

export function runDungeonQuestionChecks(map: DungeonMapDefinition): void {
  const usedQuestionIds = new Set<string>();
  for (const room of map.rooms.filter((candidate) => candidate.type === "combat")) {
    if (!room.combatConfig) {
      throw new Error(`[dungeonQuestionChecks] ${room.id} needs combatConfig`);
    }
    const questions = getDungeonQuestionSet(room.combatConfig.questionSetId);
    for (const question of questions) {
      if (usedQuestionIds.has(question.id)) {
        throw new Error(`[dungeonQuestionChecks] duplicate question: ${question.id}`);
      }
      usedQuestionIds.add(question.id);
    }
  }
  console.info("dungeon question checks: PASS");
}
