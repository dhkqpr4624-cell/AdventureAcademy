export type PlayerDamageResult = {
  nextHp: number;
  isDefeated: boolean;
};

export function resolvePlayerDamage(
  currentHp: number,
  damage: number,
): PlayerDamageResult {
  const nextHp = Math.max(0, currentHp - Math.max(0, damage));
  return { nextHp, isDefeated: nextHp === 0 };
}
