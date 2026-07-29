import { resolveDungeonGoldDrop } from "./dungeonGoldDropResolver";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon gold drop checks] ${message}`);
}

export function runDungeonGoldDropChecks() {
  const normal = resolveDungeonGoldDrop("gold-seed", "room-a", "normal");
  const elite = resolveDungeonGoldDrop("gold-seed", "room-b", "elite");
  const treasure = resolveDungeonGoldDrop("gold-seed", "room-c", "treasure");
  check(normal >= 3 && normal <= 6, "normal drop is 3-6");
  check(elite >= 6 && elite <= 10, "elite drop is 6-10");
  check(treasure >= 1 && treasure <= 20, "treasure drop is 1-20");
  check(
    normal === resolveDungeonGoldDrop("gold-seed", "room-a", "normal"),
    "same seed and room repeat",
  );
  console.info("dungeon gold drop checks: PASS");
}
