import {
  completeRoomEventWithResult,
  createInitialRoomProgress,
} from "./dungeonRoomProgress";
import { resolveDungeonRoomEvent } from "./dungeonRoomEventResolver";
import { resolveRoomEntry } from "./RoomEventController";
import { getDungeonRoom, TEST_DUNGEON_MAP } from "./testDungeonMap";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[dungeonRoomEventChecks] ${message}`);
  }
}

export function runDungeonRoomEventChecks(): void {
  const initial = createInitialRoomProgress(TEST_DUNGEON_MAP);
  const treasure = getDungeonRoom("room-treasure");
  const trap = getDungeonRoom("room-trap");
  check(
    resolveRoomEntry(treasure, initial[treasure.id]).type === "showTreasure",
    "treasure must wait for investigation",
  );
  const treasureCorrect = resolveDungeonRoomEvent(treasure, true);
  const treasureWrong = resolveDungeonRoomEvent(treasure, false);
  check(treasureCorrect.eventResult === "treasureOpened", "correct treasure opens");
  check(treasureCorrect.damage === 0, "treasure never damages");
  check(treasureWrong.eventResult === "treasureLocked", "wrong treasure locks");
  check(
    resolveRoomEntry(trap, initial[trap.id]).type === "startTrap",
    "trap must start on entry",
  );
  const trapCorrect = resolveDungeonRoomEvent(trap, true);
  const trapWrong = resolveDungeonRoomEvent(trap, false);
  check(trapCorrect.damage === 0, "correct trap deals no damage");
  check(trapWrong.damage === 10, "wrong trap uses configured damage");
  const completedTrap = completeRoomEventWithResult(
    initial,
    trap.id,
    trapWrong.eventResult,
  );
  check(
    resolveRoomEntry(trap, completedTrap[trap.id]).type === "explore",
    "completed trap never restarts",
  );
  const reset = createInitialRoomProgress(TEST_DUNGEON_MAP);
  check(
    !reset[treasure.id].eventCompleted && !reset[trap.id].eventCompleted,
    "dungeon reset reactivates both events",
  );
  console.info("dungeon room event checks: PASS");
}
