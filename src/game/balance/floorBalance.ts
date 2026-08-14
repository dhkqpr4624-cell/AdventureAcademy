export const BASE_PLAYER_MAX_HP = 50;
export const ARMOR_MAX_HP_PER_TIER = 5;

export const POTION_CAPS = {
  small: 3,
  medium: 2,
} as const;

export const POTION_HEALING = {
  small: 20,
  medium: 35,
} as const;

export type FloorRewardKind = "weaponSkin" | "armor" | "finalBoss";
export type CombatDifficultyKind = "normal" | "elite";

const asFloorNumber = (floorNumber: number) =>
  Math.max(1, Math.floor(floorNumber));

export function getFloorNumber(floorId: string): number {
  const match = /(\d+)$/.exec(floorId);
  return match ? asFloorNumber(Number(match[1])) : 1;
}

export function getFloorRewardKind(floorNumber: number): FloorRewardKind {
  const floor = asFloorNumber(floorNumber);
  if (floor === 10) return "finalBoss";
  return floor >= 3 && floor % 2 === 1 ? "armor" : "weaponSkin";
}

export function getArmorMaxHpBonusForFloor(floorNumber: number): number {
  const floor = asFloorNumber(floorNumber);
  if (getFloorRewardKind(floor) !== "armor") return 0;
  return Math.floor((floor - 1) / 2) * ARMOR_MAX_HP_PER_TIER;
}

export function getExpectedMaxHpForFloor(floorNumber: number): number {
  const floor = asFloorNumber(floorNumber);
  return BASE_PLAYER_MAX_HP + Math.max(0, Math.floor((floor - 1) / 2)) * ARMOR_MAX_HP_PER_TIER;
}

export function getExpectedPotionHealing(): number {
  return POTION_CAPS.small * POTION_HEALING.small +
    POTION_CAPS.medium * POTION_HEALING.medium;
}

/**
 * Damage grows from the same expected-HP curve as armor. The six-hit horizon
 * keeps a highly accurate run survivable without requiring potion use, while
 * repeated mistakes make potion management increasingly important.
 */
export function getMonsterDamageForFloor(
  floorNumber: number,
  kind: CombatDifficultyKind = "normal",
): number {
  const floor = asFloorNumber(floorNumber);
  const normal = Math.max(1, Math.ceil(getExpectedMaxHpForFloor(floor) / 6));
  // Floor 4 keeps wrong-answer pressure, but removes the extra elite basic-hit
  // surcharge so a 75% run stays within the intended one-to-two-potion range.
  if (floor === 4 && kind === "elite") return normal;
  return kind === "elite" ? Math.ceil(normal * 1.25) : normal;
}

export function getWrongAnswerDamageForFloor(
  floorNumber: number,
  totalQuestionBudget = 10,
): number {
  const questions = Math.max(2, Math.floor(totalQuestionBudget));
  const targetWrongAnswers = Math.max(1, Math.ceil(questions * 0.5));
  const highAccuracyAttackCount = Math.max(1, Math.ceil(questions * 0.4));
  const sustainBudget =
    getExpectedMaxHpForFloor(floorNumber) + getExpectedPotionHealing();
  const highAccuracyDamage =
    highAccuracyAttackCount * getMonsterDamageForFloor(floorNumber, "normal");
  return Math.max(
    getMonsterDamageForFloor(floorNumber, "normal"),
    Math.ceil((sustainBudget - highAccuracyDamage + 1) / targetWrongAnswers),
  );
}

export function getTrapDamageForFloor(floorNumber: number): number {
  return Math.ceil(getMonsterDamageForFloor(floorNumber, "normal") * 1.5);
}

export type GoldRewardKind = "normal" | "elite" | "treasure";

export function getGoldRangeForFloor(
  floorNumber: number,
  kind: GoldRewardKind,
): readonly [minimum: number, maximum: number] {
  const tier = Math.floor((asFloorNumber(floorNumber) - 1) / 2);
  const economyOffset = tier * 2;
  if (kind === "treasure") return [1 + economyOffset, 20 + economyOffset];
  if (kind === "elite") return [6 + economyOffset, 10 + economyOffset];
  return [3 + economyOffset, 6 + economyOffset];
}

export type PotionSize = "small" | "medium";

export function getPotionPriceForFloor(
  floorNumber: number,
  size: PotionSize,
): number {
  const tier = Math.floor((asFloorNumber(floorNumber) - 1) / 2);
  return size === "small" ? 8 + tier * 2 : 14 + tier * 3;
}

export function isRareRewardEligible(
  correctAnswerCount: number,
  totalQuestionCount: number,
): boolean {
  if (totalQuestionCount <= 0) return false;
  return correctAnswerCount / totalQuestionCount >= 0.75;
}
