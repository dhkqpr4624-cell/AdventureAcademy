import { completeRoomEvent, createInitialRoomProgress } from "./dungeonRoomProgress";
import { resolveDungeonCompletion } from "./dungeonCompletionResolver";
import { TEST_DUNGEON_MAP } from "./testDungeonMap";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[dungeonCompletionChecks] ${message}`);
  }
}

export function runDungeonCompletionChecks(): void {
  const initial = createInitialRoomProgress(TEST_DUNGEON_MAP);
  check(
    !resolveDungeonCompletion(TEST_DUNGEON_MAP, initial).canComplete,
    "an untouched dungeon cannot complete",
  );
  const combatRoomIds = TEST_DUNGEON_MAP.rooms
    .filter((room) => room.type === "combat" || room.type === "elite")
    .map((room) => room.id);
  const oneCompleted = completeRoomEvent(initial, combatRoomIds[0]);
  check(
    !resolveDungeonCompletion(TEST_DUNGEON_MAP, oneCompleted).canComplete,
    "one completed combat room is insufficient",
  );
  const allCompleted = combatRoomIds.reduce(completeRoomEvent, initial);
  check(
    resolveDungeonCompletion(TEST_DUNGEON_MAP, allCompleted).canComplete,
    "all normal and elite combat rooms must allow completion",
  );
  check(
    !resolveDungeonCompletion(
      TEST_DUNGEON_MAP,
      createInitialRoomProgress(TEST_DUNGEON_MAP),
    ).canComplete,
    "reset must block completion again",
  );
  console.info("dungeon completion checks: PASS");
}
