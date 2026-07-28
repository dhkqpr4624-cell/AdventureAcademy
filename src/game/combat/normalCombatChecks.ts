import { resolveNormalCombat } from "./normalCombatResolver";

const CASES = [
  {
    answers: [true, true] as const,
    outcome: "perfectVictory",
    enemyAttackCount: 1,
    enemyDefeated: true,
  },
  {
    answers: [true, false] as const,
    outcome: "enemyEscaped",
    enemyAttackCount: 2,
    enemyDefeated: false,
  },
  {
    answers: [false, true] as const,
    outcome: "enemyEscaped",
    enemyAttackCount: 2,
    enemyDefeated: false,
  },
  {
    answers: [false, false] as const,
    outcome: "enemyEscaped",
    enemyAttackCount: 2,
    enemyDefeated: false,
  },
] as const;

export function runNormalCombatChecks(): void {
  for (const expected of CASES) {
    const actual = resolveNormalCombat(expected.answers);
    const passed =
      actual.outcome === expected.outcome &&
      actual.enemyAttackCount === expected.enemyAttackCount &&
      actual.enemyDefeated === expected.enemyDefeated;

    if (!passed) {
      throw new Error(
        `Normal combat check failed: ${JSON.stringify(expected.answers)}`,
      );
    }
  }
}
