import { resolvePlayerDamage } from "../player/playerDamageResolver";
import { resolveDungeonRunExitPolicy } from "./dungeonRunExitResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon failure checks] ${message}`);
}

export function runDungeonFailureChecks() {
  assert(resolvePlayerDamage(7, 7).isDefeated, "normal attack defeat");
  assert(resolvePlayerDamage(8, 8).isDefeated, "elite attack defeat");
  assert(resolvePlayerDamage(5, 10).isDefeated, "trap defeat");
  assert(resolveDungeonRunExitPolicy("defeatedRetry").restoreHpToMax, "retry restores HP");
  assert(resolveDungeonRunExitPolicy("defeatedReturnToBaseCamp").restoreHpToMax, "return restores HP");
  assert(!resolveDungeonRunExitPolicy("voluntary").restoreHpToMax, "voluntary exit preserves HP");
}
