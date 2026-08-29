export const DUNGEON10_DODGE_FAILURE_DAMAGE = 24;
export const DUNGEON10_WRONG_ANSWER_DAMAGE = 44;

const QUESTION_COUNT = 15;
const MAX_HP = 70;
const ALL_POTION_HEALING = 3 * 20 + 2 * 35;
const SUPPORT_HEALING = MAX_HP;
const DODGE_ATTACK_CHANCE = 0.25;
const DODGE_HEAL_CHANCE = 0.125;

function expectedDamage(accuracy: number): number {
  const correct = QUESTION_COUNT * accuracy;
  const wrong = QUESTION_COUNT - correct;
  return wrong * DUNGEON10_WRONG_ANSWER_DAMAGE
    + correct * DODGE_ATTACK_CHANCE * DUNGEON10_DODGE_FAILURE_DAMAGE;
}

function expectedSustain(accuracy: number, supportCount: number): number {
  const expectedDodgeHealing = QUESTION_COUNT * accuracy * DODGE_HEAL_CHANCE * 15;
  return MAX_HP + ALL_POTION_HEALING + expectedDodgeHealing
    + supportCount * SUPPORT_HEALING;
}

export function runBossDamageBalanceChecks(): void {
  if (DUNGEON10_WRONG_ANSWER_DAMAGE <= DUNGEON10_DODGE_FAILURE_DAMAGE) {
    throw new Error("[BossDamageBalance] wrong-answer damage must exceed dodge-failure damage");
  }
  const highAccuracyDamage = expectedDamage(0.75);
  if (
    highAccuracyDamage <= expectedSustain(0.75, 0)
    || highAccuracyDamage > expectedSustain(0.75, 1)
  ) {
    throw new Error("[BossDamageBalance] 75% accuracy must require about one support");
  }
  if (expectedDamage(0.4) <= expectedSustain(0.4, 2)) {
    throw new Error("[BossDamageBalance] 40% accuracy must fail after two supports");
  }
}
