import {
  DEFAULT_CRITICAL_CHANCE,
  applyCriticalResult,
  resolveCritical,
  type CriticalCombatState,
} from "./criticalResolver";
import {
  ELITE_COMBAT_QUESTION_COUNT,
  ELITE_ENEMY_ATTACK_DAMAGE,
  resolveEliteCombat,
} from "./eliteCombatResolver";
import { resolvePotionUse } from "./potionResolver";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[eliteCombatChecks] ${message}`);
  }
}

const answers = (...values: boolean[]) => ({
  answers: values.map((isCorrect) => ({ isCorrect })),
});

export function runEliteCombatChecks(): void {
  check(ELITE_COMBAT_QUESTION_COUNT === 3, "question count must be 3");
  check(ELITE_ENEMY_ATTACK_DAMAGE === 8, "attack damage must be 8");
  const perfect = resolveEliteCombat(answers(true, true, true));
  const normal = resolveEliteCombat(answers(true, false, true));
  const hard = resolveEliteCombat(answers(false, true, false));
  const escaped = resolveEliteCombat(answers(false, false, false));
  check(perfect.result === "perfectVictory", "3 correct must be perfect");
  check(normal.result === "enemyEscaped", "2 correct must escape");
  check(hard.result === "enemyEscaped", "1 correct must escape");
  check(escaped.result === "enemyEscaped", "0 correct must escape");
  check(
    perfect.suppressFinalEnemyTurn,
    "only three correct answers suppress the final turn",
  );
  check(!normal.suppressFinalEnemyTurn, "two correct keeps the final turn");
  check(!hard.suppressFinalEnemyTurn, "one correct keeps the final turn");
  check(!escaped.suppressFinalEnemyTurn, "zero correct keeps the final turn");
  check(perfect.plannedEnemyAttackCount === 2, "perfect plans two turns");
  check(normal.plannedEnemyAttackCount === 3, "two correct plans three turns");
  check(hard.plannedEnemyAttackCount === 3, "one correct plans three turns");
  check(escaped.plannedEnemyAttackCount === 3, "escape plans three turns");

  let criticalState: CriticalCombatState = {
    hasCriticalOccurred: false,
    enemyStunned: false,
    pendingSkipEnemyTurn: false,
  };
  const firstCritical = resolveCritical(
    {
      isCorrect: true,
      hasCriticalOccurred: criticalState.hasCriticalOccurred,
      chance: DEFAULT_CRITICAL_CHANCE,
    },
    0,
  );
  criticalState = applyCriticalResult(criticalState, firstCritical, true);
  const secondCritical = resolveCritical(
    {
      isCorrect: true,
      hasCriticalOccurred: criticalState.hasCriticalOccurred,
      chance: DEFAULT_CRITICAL_CHANCE,
    },
    0,
  );
  check(firstCritical.isCritical && !secondCritical.isCritical, "critical is capped at one");
  const finalCriticalState = applyCriticalResult(
    { ...criticalState, pendingSkipEnemyTurn: false, enemyStunned: false },
    firstCritical,
    false,
  );
  check(
    !finalCriticalState.pendingSkipEnemyTurn,
    "suppressed final turn must not create a lingering stun",
  );
  check(
    resolveEliteCombat(answers(false, false, true)).result === "enemyEscaped",
    "final critical presentation cannot change the answer result",
  );

  const questionIndex = 1;
  const potion = resolvePotionUse({
    currentHp: 10,
    maxHp: 50,
    potionKind: "smallPotion",
    quantity: 1,
  });
  check(potion.success && questionIndex === 1, "potion does not consume a question");
  console.info("elite combat checks: PASS");
}
