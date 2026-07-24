export type NormalCombatOutcome =
  | "perfectVictory"
  | "hardVictory"
  | "enemyEscaped";

export type NormalCombatResolution = {
  outcome: NormalCombatOutcome;
  enemyAttackCount: number;
  enemyDefeated: boolean;
  correctAnswerCount: number;
};

export function resolveNormalCombat(
  answers: readonly [boolean, boolean],
): NormalCombatResolution {
  const correctAnswerCount = answers.filter(Boolean).length;

  if (correctAnswerCount === 2) {
    return {
      outcome: "perfectVictory",
      enemyAttackCount: 1,
      enemyDefeated: true,
      correctAnswerCount,
    };
  }

  if (correctAnswerCount === 1) {
    return {
      outcome: "hardVictory",
      enemyAttackCount: 1,
      enemyDefeated: true,
      correctAnswerCount,
    };
  }

  return {
    outcome: "enemyEscaped",
    enemyAttackCount: 2,
    enemyDefeated: false,
    correctAnswerCount,
  };
}
