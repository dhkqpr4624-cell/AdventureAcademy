import {
  DEFAULT_CRITICAL_CHANCE,
  applyCriticalResult,
  consumeEnemyTurnSkip,
  resolveCritical,
  type CriticalCombatState,
} from "./criticalResolver";

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[critical check] ${message}`);
}

export function runCriticalChecks(): void {
  const fresh: CriticalCombatState = {
    hasCriticalOccurred: false,
    enemyStunned: false,
    pendingSkipEnemyTurn: false,
  };
  const resolve = (isCorrect: boolean, occurred: boolean, randomValue: number) =>
    resolveCritical(
      { isCorrect, hasCriticalOccurred: occurred, chance: DEFAULT_CRITICAL_CHANCE },
      randomValue,
    );

  expect(resolve(true, false, 0.03).isCritical, "정답 + 0.03");
  expect(!resolve(true, false, 0.5).isCritical, "정답 + 0.50");
  expect(!resolve(false, false, 0).isCritical, "오답 + 0.00");
  expect(!resolve(true, true, 0).isCritical, "전투당 두 번째 크리티컬 차단");
  expect(!resolve(true, false, 0.08).isCritical, "chance 경계값");

  const stunned = applyCriticalResult(fresh, resolve(true, false, 0), true);
  expect(stunned.pendingSkipEnemyTurn, "다음 몬스터 턴 생략 예약");
  expect(stunned.enemyStunned, "몬스터 기절");
  const hpBeforeSkip = 50;
  const attacksBeforeSkip = 0;
  const consumed = consumeEnemyTurnSkip(stunned);
  expect(consumed.skipped, "몬스터 턴 한 번 생략");
  expect(!consumed.state.pendingSkipEnemyTurn, "생략 후 예약 해제");
  expect(!consumed.state.enemyStunned, "생략 후 기절 해제");
  expect(hpBeforeSkip === 50, "생략 시 HP 유지");
  expect(attacksBeforeSkip === 0, "생략 시 실제 공격 횟수 유지");

  const finalCritical = applyCriticalResult(fresh, resolve(true, false, 0), false);
  expect(
    !finalCritical.pendingSkipEnemyTurn && !finalCritical.enemyStunned,
    "마지막 문제 뒤 기절 비잔존",
  );
}
