export type PotionKind = "smallPotion" | "mediumPotion";

export type PotionUseResult = {
  success: boolean;
  nextHp: number;
  healedAmount: number;
  remainingQuantity: number;
  failureReason?: "empty" | "fullHp";
};

const POTION_HEAL_AMOUNTS: Readonly<Record<PotionKind, number>> = {
  smallPotion: 20,
  mediumPotion: 35,
};

type ResolvePotionUseInput = {
  currentHp: number;
  maxHp: number;
  potionKind: PotionKind;
  quantity: number;
};

export function getPotionHealAmount(potionKind: PotionKind): number {
  return POTION_HEAL_AMOUNTS[potionKind];
}

export function resolvePotionUse({
  currentHp,
  maxHp,
  potionKind,
  quantity,
}: ResolvePotionUseInput): PotionUseResult {
  if (quantity <= 0) {
    return {
      success: false,
      nextHp: currentHp,
      healedAmount: 0,
      remainingQuantity: quantity,
      failureReason: "empty",
    };
  }

  if (currentHp >= maxHp) {
    return {
      success: false,
      nextHp: currentHp,
      healedAmount: 0,
      remainingQuantity: quantity,
      failureReason: "fullHp",
    };
  }

  const nextHp = Math.min(maxHp, currentHp + getPotionHealAmount(potionKind));
  return {
    success: true,
    nextHp,
    healedAmount: nextHp - currentHp,
    remainingQuantity: quantity - 1,
  };
}
