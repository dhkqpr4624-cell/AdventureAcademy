export const DEFAULT_CRITICAL_CHANCE = 0.08;

export type CriticalContext = {
  isCorrect: boolean;
  hasCriticalOccurred: boolean;
  chance: number;
};

export type CriticalResult = {
  isCritical: boolean;
  shouldStunEnemy: boolean;
};

export type CriticalCombatState = {
  hasCriticalOccurred: boolean;
  enemyStunned: boolean;
  pendingSkipEnemyTurn: boolean;
};

export function resolveCritical(
  context: CriticalContext,
  randomValue: number,
): CriticalResult {
  const isCritical =
    context.isCorrect &&
    !context.hasCriticalOccurred &&
    randomValue >= 0 &&
    randomValue < context.chance;
  return { isCritical, shouldStunEnemy: isCritical };
}

export function applyCriticalResult(
  state: CriticalCombatState,
  result: CriticalResult,
  hasUpcomingEnemyTurn: boolean,
): CriticalCombatState {
  if (!result.isCritical) {
    return state;
  }
  return {
    hasCriticalOccurred: true,
    enemyStunned: result.shouldStunEnemy && hasUpcomingEnemyTurn,
    pendingSkipEnemyTurn: result.shouldStunEnemy && hasUpcomingEnemyTurn,
  };
}

export function consumeEnemyTurnSkip(state: CriticalCombatState): {
  state: CriticalCombatState;
  skipped: boolean;
} {
  if (!state.pendingSkipEnemyTurn) {
    return { state, skipped: false };
  }
  return {
    state: { ...state, enemyStunned: false, pendingSkipEnemyTurn: false },
    skipped: true,
  };
}
