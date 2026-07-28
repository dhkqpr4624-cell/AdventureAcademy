import { QUEST_DEFINITIONS } from "../quest/questDefinitions";
import { QuestManager } from "../quest/QuestManager";
import type { StoryActionState } from "../story/storyActionTypes";
import { FLOOR_DEFINITIONS, INITIAL_FLOOR_UNLOCK_STATE } from "./floorDefinitions";
import { FloorUnlockManager } from "./FloorUnlockManager";
import { resolveQuestFloorUnlock } from "./FloorUnlockResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[floor unlock checks] ${message}`);
}

export function runFloorUnlockChecks() {
  assert(
    new Set(FLOOR_DEFINITIONS.map((floor) => floor.id)).size ===
      FLOOR_DEFINITIONS.length,
    "duplicate floor id",
  );

  const unlocked = FloorUnlockManager.unlockFloor(
    INITIAL_FLOOR_UNLOCK_STATE,
    "floor-1",
  );
  assert(unlocked.success && unlocked.changed, "floor unlock failed");
  assert(
    FloorUnlockManager.isUnlocked(unlocked.nextState, "floor-1"),
    "unlocked floor is still locked",
  );
  assert(
    FloorUnlockManager.getUnlockedFloors(unlocked.nextState)[0] === "floor-1",
    "unlocked floor lookup failed",
  );
  assert(
    !FloorUnlockManager.unlockFloor(unlocked.nextState, "floor-1").changed,
    "duplicate floor unlock was not ignored",
  );

  const quest = QUEST_DEFINITIONS[0];
  const accepted = QuestManager.acceptQuest(
    { [quest.id]: "available" },
    quest.id,
  );
  assert(accepted.success, "quest accept prerequisite failed");

  let saveCalls = 0;
  const initialActions: StoryActionState = { executedActionIds: [] };
  const first = resolveQuestFloorUnlock({
    questId: quest.id,
    floorState: INITIAL_FLOOR_UNLOCK_STATE,
    actionState: initialActions,
    save: () => {
      saveCalls += 1;
    },
  });
  assert(first.changed, "quest accept did not unlock its floor");
  assert(saveCalls === 1, "floor unlock must save exactly once");

  const replay = resolveQuestFloorUnlock({
    questId: quest.id,
    floorState: first.nextFloorState,
    actionState: first.nextActionState,
    save: () => {
      saveCalls += 1;
    },
  });
  assert(!replay.changed, "replay executed floor unlock again");
  assert(saveCalls === 1, "replay saved again");

  const lockedSelectable = FloorUnlockManager.isUnlocked(
    INITIAL_FLOOR_UNLOCK_STATE,
    "floor-1",
  );
  const openSelectable = FloorUnlockManager.isUnlocked(
    first.nextFloorState,
    "floor-1",
  );
  assert(!lockedSelectable, "locked floor must not be selectable");
  assert(openSelectable, "unlocked floor must be selectable");
}
