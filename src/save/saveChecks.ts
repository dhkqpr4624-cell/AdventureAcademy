import { INITIAL_PLAYER_STATE } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import { migrateSaveData } from "./SaveMigration";
import { createInitialGameSaveState, createSaveDataFromGameState } from "./saveStateAdapter";
import { validateCurrentSave } from "./saveSchema";
import { planBackupRotation } from "./SaveManager";
import { AutoSaveCoordinator } from "./AutoSaveCoordinator";

const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`[save checks] ${message}`);
};

export function runSaveChecks() {
  const state = createInitialGameSaveState();
  state.playerState.currentHp = 31;
  state.playerState.gold = 19;
  state.inventoryState.items["potion-small"] = 3;
  state.questState["quest-floor-1-memory-fragment"] = "active";
  state.floorUnlockState.unlockedFloorIds = ["floor-1"];
  state.storyActionState.executedActionIds = ["quest:quest-floor-1-memory-fragment:unlock:floor-1"];
  const save = createSaveDataFromGameState(state);
  const validated = validateCurrentSave(JSON.parse(JSON.stringify(save)));
  check(validated?.version === 4, "current version");
  check(validated?.player.currentHp === 31, "HP round trip");
  check(validated?.player.gold === 19, "gold round trip");
  check(validated?.inventory.items["potion-small"] === 3, "inventory round trip");
  check(validated?.quests.activeQuestId === "quest-floor-1-memory-fragment", "active quest");
  check(validated?.floors.unlockedFloorIds.includes("floor-1"), "floor unlock");
  check(validated?.story.executedActionIds.length === 1, "action id");
}

export function runSaveMigrationChecks() {
  const migrated = migrateSaveData({ playerLevel: 2, hp: 17, activeQuestId: "quest-floor-1-memory-fragment", unlockedFloors: ["floor-1"] });
  check(migrated.success && migrated.data.version === 4 && migrated.data.player.gold === 0, "v0 migration");
  const v1 = createSaveDataFromGameState(createInitialGameSaveState()) as unknown as Record<string, unknown>;
  v1.version = 1;
  v1.player = { level: 3, currentHp: 28, maxHp: 50 };
  const migratedV1 = migrateSaveData(v1);
  check(
    migratedV1.success &&
      migratedV1.migratedFromVersion === 1 &&
      migratedV1.data.player.gold === 0 &&
      !("level" in migratedV1.data.player),
    "v1 removes level and initializes gold",
  );
  const v2 = createSaveDataFromGameState(createInitialGameSaveState()) as unknown as Record<string, unknown>;
  v2.version = 2;
  v2.inventory = { items: {}, equippedItemIds: {} };
  const migratedV2 = migrateSaveData(v2);
  check(
    migratedV2.success &&
      migratedV2.migratedFromVersion === 2 &&
      migratedV2.data.inventory.items["potion-small"] === 2,
    "v2 initializes inventory and potion quantities",
  );
  check(migrateSaveData({ version: 999 }).success === false, "future version rejected");
  check(migrateSaveData(null).success === false, "invalid schema rejected");
  check(INITIAL_PLAYER_STATE.maxHp > 0 && Object.keys(INITIAL_QUEST_STATE).length > 0, "defaults available");
}

export function runSaveBackupChecks() {
  const rotation = planBackupRotation("main", "b1", "b2");
  check(rotation.backup1 === "main" && rotation.backup2 === "b1" && rotation.backup3 === "b2", "backup rotation order");
}

export function runAutoSaveChecks() {
  check(typeof AutoSaveCoordinator.prototype.requestSave === "function", "request API");
  check(typeof AutoSaveCoordinator.prototype.flush === "function", "flush API");
  check(typeof AutoSaveCoordinator.prototype.dispose === "function", "dispose API");
}
