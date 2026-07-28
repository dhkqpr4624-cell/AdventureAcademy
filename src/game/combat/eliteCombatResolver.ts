export const ELITE_COMBAT_QUESTION_COUNT = 3 as const;
export const ELITE_ENEMY_ATTACK_DAMAGE = 8 as const;

export type EliteCombatResult =
  | "perfectVictory"
  | "normalVictory"
  | "hardVictory"
  | "enemyEscaped";

export type EliteCombatResolutionInput = {
  answers: readonly { isCorrect: boolean }[];
};

export type EliteCombatResolution = {
  result: EliteCombatResult;
  correctAnswerCount: number;
  scheduledQuestionCount: 3;
  plannedEnemyAttackCount: number;
  suppressFinalEnemyTurn: boolean;
};

export function resolveEliteCombat({
  answers,
}: EliteCombatResolutionInput): EliteCombatResolution {
  if (answers.length !== ELITE_COMBAT_QUESTION_COUNT) {
    throw new Error(
      `[EliteCombatResolver] exactly ${ELITE_COMBAT_QUESTION_COUNT} answers are required`,
    );
  }

  const correctAnswerCount = answers.filter((answer) => answer.isCorrect).length;
  const suppressFinalEnemyTurn = correctAnswerCount >= 1;
  const result: EliteCombatResult =
    correctAnswerCount === 3
      ? "perfectVictory"
      : correctAnswerCount === 2
        ? "normalVictory"
        : correctAnswerCount === 1
          ? "hardVictory"
          : "enemyEscaped";

  return {
    result,
    correctAnswerCount,
    scheduledQuestionCount: ELITE_COMBAT_QUESTION_COUNT,
    plannedEnemyAttackCount: 2 + (suppressFinalEnemyTurn ? 0 : 1),
    suppressFinalEnemyTurn,
  };
}
