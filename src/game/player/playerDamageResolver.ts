export type PlayerDamageResult = {
  nextHp: number;
  isDefeated: boolean;
};

export function resolvePlayerDamage(
  currentHp: number,
  damage: number,
  defense = 0,
): PlayerDamageResult {
  const incomingDamage = Math.max(0, damage);
  const finalDamage = incomingDamage > 0
    ? Math.max(1, incomingDamage - Math.max(0, defense))
    : 0;
  const nextHp = Math.max(0, currentHp - finalDamage);
  return { nextHp, isDefeated: nextHp === 0 };
}
