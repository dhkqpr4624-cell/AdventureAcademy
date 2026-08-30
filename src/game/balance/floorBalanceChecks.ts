import {
  getArmorMaxHpBonusForFloor,
  getExpectedMaxHpForFloor,
  getFloorRewardKind,
  getGoldRangeForFloor,
  getMonsterDamageForFloor,
  getPotionPriceForFloor,
  getTrapDamageForFloor,
  getWrongAnswerDamageForFloor,
  isRareRewardEligible,
} from "./floorBalance";

const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`[floor balance checks] ${message}`);
};

export function runFloorBalanceChecks() {
  const expectedRewards = [
    "weaponSkin", "weaponSkin", "armor", "weaponSkin", "armor",
    "weaponSkin", "armor", "weaponSkin", "armor", "finalBoss",
  ] as const;
  expectedRewards.forEach((reward, index) => {
    check(getFloorRewardKind(index + 1) === reward, `floor ${index + 1} reward progression`);
  });
  check(getFloorRewardKind(1) === "weaponSkin", "floor 1 rewards a weapon skin");
  check(getFloorRewardKind(2) === "weaponSkin", "floor 2 rewards a weapon skin");
  check(getFloorRewardKind(3) === "armor", "floor 3 rewards armor");
  check(getFloorRewardKind(10) === "finalBoss", "floor 10 is final boss and ending");
  check(getArmorMaxHpBonusForFloor(3) === 5, "floor 3 armor is +5 HP");
  check(getArmorMaxHpBonusForFloor(5) === 10, "floor 5 armor is +10 HP");
  check(getArmorMaxHpBonusForFloor(9) === 20, "floor 9 armor is +20 HP");
  check(getExpectedMaxHpForFloor(1) === 50, "floor 1 expected HP");
  check(getExpectedMaxHpForFloor(2) === 50, "floor 2 expected HP");
  check(getExpectedMaxHpForFloor(3) === 55, "floor 3 expected HP");
  check(getExpectedMaxHpForFloor(6) === 60, "floor 6 expected HP");
  check(getExpectedMaxHpForFloor(9) === 70, "floor 9 expected HP after +20 armor");
  check(getExpectedMaxHpForFloor(10) === 70, "floor 10 retains floor 9 armor HP");
  for (let floor = 2; floor <= 10; floor += 1) {
    check(
      getMonsterDamageForFloor(floor) >= getMonsterDamageForFloor(floor - 1),
      `floor ${floor} monster damage never decreases`,
    );
    check(
      getWrongAnswerDamageForFloor(floor) >= getWrongAnswerDamageForFloor(floor - 1),
      `floor ${floor} wrong-answer damage never decreases`,
    );
    check(
      getTrapDamageForFloor(floor) >= getTrapDamageForFloor(floor - 1),
      `floor ${floor} trap damage never decreases`,
    );
  }
  for (let floor = 1; floor <= 9; floor += 1) {
    check(
      getMonsterDamageForFloor(floor, "elite") > getMonsterDamageForFloor(floor, "normal"),
      `floor ${floor} elite damage exceeds normal damage`,
    );
  }
  check(
    getMonsterDamageForFloor(6) > getMonsterDamageForFloor(1),
    "monster damage grows with floor HP",
  );
  check(
    getTrapDamageForFloor(6) > getTrapDamageForFloor(1),
    "trap damage grows with floor HP",
  );
  const halfWrongDamage = getWrongAnswerDamageForFloor(1) * 5;
  const accurateTurnDamage = getMonsterDamageForFloor(1) * 4;
  check(
    halfWrongDamage + accurateTurnDamage >
      getExpectedMaxHpForFloor(1) + 130,
    "50 percent wrong exhausts maximum potion sustain",
  );
  const [treasureMin, treasureMax] = getGoldRangeForFloor(1, "treasure");
  check(treasureMin === 1 && treasureMax === 20, "floor 1 treasure is 1-20 Gold");
  check(
    getPotionPriceForFloor(4, "small") > getPotionPriceForFloor(1, "small"),
    "shop prices share the floor economy tier",
  );
  check(isRareRewardEligible(6, 8), "75 percent unlocks rare reward");
  check(!isRareRewardEligible(5, 8), "below 75 percent does not unlock rare reward");
  console.info("floor balance checks: PASS");
}
