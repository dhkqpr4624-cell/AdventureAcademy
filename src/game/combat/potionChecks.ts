import { resolvePotionUse } from "./potionResolver";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[potion check] ${message}`);
  }
}

export function runPotionChecks(): void {
  const small = resolvePotionUse({
    currentHp: 20,
    maxHp: 50,
    potionKind: "smallPotion",
    quantity: 2,
  });
  assert(
    small.success &&
      small.nextHp === 40 &&
      small.healedAmount === 20 &&
      small.remainingQuantity === 1,
    "소형 물약은 HP 20과 수량 1을 정확히 반영해야 합니다.",
  );

  const capped = resolvePotionUse({
    currentHp: 43,
    maxHp: 50,
    potionKind: "mediumPotion",
    quantity: 1,
  });
  assert(
    capped.success &&
      capped.nextHp === 50 &&
      capped.healedAmount === 7 &&
      capped.remainingQuantity === 0,
    "최대 HP를 넘지 않고 실제 회복량을 반환해야 합니다.",
  );

  const empty = resolvePotionUse({
    currentHp: 10,
    maxHp: 50,
    potionKind: "smallPotion",
    quantity: 0,
  });
  assert(
    !empty.success &&
      empty.nextHp === 10 &&
      empty.remainingQuantity === 0,
    "수량이 없으면 HP와 수량이 바뀌면 안 됩니다.",
  );

  const fullHp = resolvePotionUse({
    currentHp: 50,
    maxHp: 50,
    potionKind: "mediumPotion",
    quantity: 1,
  });
  assert(
    !fullHp.success &&
      fullHp.healedAmount === 0 &&
      fullHp.remainingQuantity === 1,
    "최대 HP에서는 물약을 소비하면 안 됩니다.",
  );
}
