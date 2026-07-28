import { resolveDungeonRunExitPolicy } from "./dungeonRunExitResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon run exit checks] ${message}`);
}

export function runDungeonRunExitChecks() {
  const voluntary = resolveDungeonRunExitPolicy("voluntary");
  const retry = resolveDungeonRunExitPolicy("defeatedRetry");
  const defeatedReturn = resolveDungeonRunExitPolicy("defeatedReturnToBaseCamp");
  assert(!voluntary.restoreHpToMax && voluntary.returnToBaseCamp, "voluntary policy");
  assert(retry.restoreHpToMax && !retry.returnToBaseCamp, "retry policy");
  assert(defeatedReturn.restoreHpToMax && defeatedReturn.returnToBaseCamp, "defeat return policy");
  for (const policy of [voluntary, retry, defeatedReturn]) {
    assert(policy.resetRoomProgress, "room progress must reset");
    assert(!policy.marksFloorCleared, "exit must not clear floor");
    assert(policy.preservesQuestAndFloorState, "quest/floor state must be preserved");
  }
}
