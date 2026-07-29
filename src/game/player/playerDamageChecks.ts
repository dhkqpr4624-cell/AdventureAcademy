import { resolvePlayerDamage } from "./playerDamageResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[player damage checks] ${message}`);
}

export function runPlayerDamageChecks() {
  const cases = [
    [50, 7, 43, false],
    [7, 7, 0, true],
    [5, 8, 0, true],
    [8, 10, 0, true],
  ] as const;
  for (const [hp, damage, expectedHp, expectedDefeated] of cases) {
    const result = resolvePlayerDamage(hp, damage);
    assert(result.nextHp === expectedHp, `${hp} - ${damage} HP mismatch`);
    assert(result.isDefeated === expectedDefeated, `${hp} - ${damage} defeat mismatch`);
  }
  assert(resolvePlayerDamage(50, 6, 2).nextHp === 46, "6 damage - 2 defense must deal 4");
  assert(resolvePlayerDamage(50, 2, 5).nextHp === 49, "minimum damage must be 1");
  assert(resolvePlayerDamage(50, 0, 5).nextHp === 50, "zero damage must remain zero");
}
