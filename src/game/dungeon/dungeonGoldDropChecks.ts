import { resolveDungeonGoldDrop } from "./dungeonGoldDropResolver";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon gold drop checks] ${message}`);
}

export function runDungeonGoldDropChecks() {
  const normal = resolveDungeonGoldDrop("gold-seed", "room-a", "normal");
  const elite = resolveDungeonGoldDrop("gold-seed", "room-b", "elite");
  check(normal >= 1 && normal <= 3, "normal drop is 1-3");
  check(elite >= 3 && elite <= 5, "elite drop is 3-5");
  check(
    normal === resolveDungeonGoldDrop("gold-seed", "room-a", "normal"),
    "same seed and room repeat",
  );
  console.info("dungeon gold drop checks: PASS");
}

