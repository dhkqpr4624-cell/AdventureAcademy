import { TEST_QUESTIONS } from "../../data/testQuestions";
import type { Question } from "../../types/question";
import type { DungeonMapDefinition } from "./dungeonTypes";

export const DUNGEON_QUESTION_SETS: Readonly<Record<string, readonly Question[]>> = {
  "normal-garlic-a": [TEST_QUESTIONS[0], TEST_QUESTIONS[1]],
  "normal-garlic-b": [TEST_QUESTIONS[2], TEST_QUESTIONS[3]],
  "normal-garlic-c": [TEST_QUESTIONS[9], TEST_QUESTIONS[10]],
  "treasure-test-a": [TEST_QUESTIONS[4]],
  "trap-test-a": [TEST_QUESTIONS[5]],
  "floor1-elite-a": [TEST_QUESTIONS[6], TEST_QUESTIONS[7], TEST_QUESTIONS[8]],
};

export function getDungeonQuestionSet(
  questionSetId: string,
  expectedCount = 2,
): readonly Question[] {
  const questions = DUNGEON_QUESTION_SETS[questionSetId];
  if (!questions) {
    throw new Error(`[dungeonQuestionSets] Unknown question set: ${questionSetId}`);
  }
  if (questions.length !== expectedCount) {
    throw new Error(
      `[dungeonQuestionSets] ${questionSetId} must contain exactly ${expectedCount} questions`,
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
  for (const room of map.rooms.filter((candidate) => candidate.type === "elite")) {
    if (!room.eliteConfig) {
      throw new Error(`[dungeonQuestionChecks] ${room.id} needs eliteConfig`);
    }
    const questions = getDungeonQuestionSet(room.eliteConfig.questionSetId, 3);
    for (const question of questions) {
      if (usedQuestionIds.has(question.id)) {
        throw new Error(`[dungeonQuestionChecks] duplicate question: ${question.id}`);
      }
      usedQuestionIds.add(question.id);
    }
  }
  for (const room of map.rooms.filter(
    (candidate) => candidate.type === "treasure" || candidate.type === "trap",
  )) {
    if (!room.eventConfig) {
      throw new Error(`[dungeonQuestionChecks] ${room.id} needs eventConfig`);
    }
    getDungeonQuestionSet(room.eventConfig.questionSetId, 1);
  }
  console.info("dungeon question checks: PASS");
}
