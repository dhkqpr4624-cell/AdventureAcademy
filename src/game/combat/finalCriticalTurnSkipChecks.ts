import {
  applyCriticalResult,
  consumeEnemyTurnSkip,
  type CriticalCombatState,
} from "./criticalResolver";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[final critical turn-skip check] ${message}`);
}

const initial = (): CriticalCombatState => ({
  hasCriticalOccurred: false,
  enemyStunned: false,
  pendingSkipEnemyTurn: false,
});

export function runFinalCriticalTurnSkipChecks(): void {
  for (const [kind, answers] of [
    ["normal", [false, true]],
    ["elite", [false, true, true]],
  ] as const) {
    const state = applyCriticalResult(
      initial(),
      { isCritical: true, shouldStunEnemy: true },
      answers.filter(Boolean).length < answers.length,
    );
    const consumed = consumeEnemyTurnSkip(state);
    check(consumed.skipped, `${kind}: final scheduled attack is skipped`);
    check(!consumed.state.enemyStunned, `${kind}: stun is cleared`);
    check(!consumed.state.pendingSkipEnemyTurn, `${kind}: pending skip is cleared`);
  }
  for (const [kind, answers] of [
    ["normal", [true, true]],
    ["elite", [true, true, true]],
  ] as const) {
    const state = applyCriticalResult(
      initial(),
      { isCritical: true, shouldStunEnemy: true },
      answers.filter(Boolean).length < answers.length,
    );
    check(!state.pendingSkipEnemyTurn, `${kind}: perfect result creates no virtual skip`);
  }
}
