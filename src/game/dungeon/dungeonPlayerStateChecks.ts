import {
  DUNGEON_PLAYER_MAX_HP,
  INITIAL_DUNGEON_PLAYER_STATE,
  applyDungeonPlayerDamage,
  applyDungeonPlayerHealing,
  resolveDungeonPlayerStateReset,
  type DungeonPlayerState,
} from "./dungeonPlayerState";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[dungeonPlayerStateChecks] ${message}`);
  }
}

function sameState(
  actual: DungeonPlayerState,
  expected: DungeonPlayerState,
  message: string,
) {
  assert(
    actual.hp === expected.hp &&
      actual.smallPotionQuantity === expected.smallPotionQuantity &&
      actual.mediumPotionQuantity === expected.mediumPotionQuantity,
    message,
  );
}

export function runDungeonPlayerStateChecks(): void {
  const afterCombatA: DungeonPlayerState = {
    hp: applyDungeonPlayerDamage(DUNGEON_PLAYER_MAX_HP, 14),
    smallPotionQuantity: 1,
    mediumPotionQuantity: 1,
  };
  sameState(
    resolveDungeonPlayerStateReset(afterCombatA, "encounter"),
    afterCombatA,
    "combat-a damage and potion quantities must persist into combat-b",
  );

  const afterPotion: DungeonPlayerState = {
    ...afterCombatA,
    hp: applyDungeonPlayerHealing(29, 20),
    smallPotionQuantity: 0,
  };
  sameState(
    resolveDungeonPlayerStateReset(afterPotion, "encounter"),
    afterPotion,
    "potion healing must persist after an encounter reset",
  );

  const afterTrap: DungeonPlayerState = {
    ...afterPotion,
    hp: applyDungeonPlayerDamage(43, 10),
  };
  sameState(
    resolveDungeonPlayerStateReset(afterTrap, "encounter"),
    afterTrap,
    "trap damage must persist into the next room",
  );

  for (const roomKind of [
    "treasure",
    "empty",
    "completedRoom",
    "enemyEscaped",
    "perfectVictory",
    "hardVictory",
  ]) {
    sameState(
      resolveDungeonPlayerStateReset(afterTrap, "encounter"),
      afterTrap,
      `${roomKind} must not reset dungeon player state`,
    );
  }

  sameState(
    resolveDungeonPlayerStateReset(afterTrap, "dungeonRun"),
    INITIAL_DUNGEON_PLAYER_STATE,
    "only a dungeon-run reset may restore HP and potion quantities",
  );
  assert(
    applyDungeonPlayerHealing(49, 20) === DUNGEON_PLAYER_MAX_HP,
    "healing must clamp to maximum HP",
  );
  assert(
    applyDungeonPlayerDamage(3, 10) === 0,
    "damage must clamp to zero HP",
  );

  if (import.meta.env.DEV) {
    console.info("dungeon player state checks: PASS");
  }
}
