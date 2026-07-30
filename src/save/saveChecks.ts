import { INITIAL_PLAYER_STATE } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import { migrateSaveData } from "./SaveMigration";
import { applySaveDataToGameState, createInitialGameSaveState, createSaveDataFromGameState } from "./saveStateAdapter";
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
  state.inventoryState.items["armor-gwanggaeto"] = 1;
  state.inventoryState.equippedItemIds.armor = "armor-gwanggaeto";
  state.questState["quest-floor-1-memory-fragment"] = "active";
  state.floorUnlockState.unlockedFloorIds = ["floor-1"];
  state.storyActionState.executedActionIds = ["quest:quest-floor-1-memory-fragment:unlock:floor-1"];
  state.currentFloorId = "floor-1";
  state.currentFloorRun = {
    floorId: "floor-1",
    seed: "save-check-seed",
    currentRoomId: "room-east",
    minimapVisible: true,
    roomProgress: {
      start: { roomId: "start", eventCompleted: true },
      "room-east": { roomId: "room-east", eventCompleted: true },
    },
  };
  const save = createSaveDataFromGameState(state);
  const validated = validateCurrentSave(JSON.parse(JSON.stringify(save)));
  check(validated?.version === 7, "current version");
  check(validated?.player.currentHp === 31, "HP round trip");
  check(validated?.player.gold === 19, "gold round trip");
  check(validated?.inventory.items["potion-small"] === 3, "inventory round trip");
  check(validated?.inventory.equippedItemIds.armor === "armor-gwanggaeto", "armor round trip");
  check(validated?.player.maxHp === 55, "armor max HP round trip");
  const loaded = validated ? applySaveDataToGameState(validated) : null;
  check(
    loaded?.inventoryState.equippedItemIds.armor === "armor-gwanggaeto" &&
      loaded.playerState.currentHp === 31 &&
      loaded.playerState.maxHp === 55,
    "load derives max HP from equipped armor",
  );
  check(validated?.quests.activeQuestId === "quest-floor-1-memory-fragment", "active quest");
  check(validated?.floors.unlockedFloorIds.includes("floor-1"), "floor unlock");
  check(validated?.story.executedActionIds.length === 1, "action id");
  check(
    validated?.dungeon.currentFloorRun?.seed === "save-check-seed" &&
      validated.dungeon.currentFloorRun.currentRoomId === "room-east" &&
      validated.dungeon.currentFloorRun.roomProgress["room-east"]?.eventCompleted,
    "dungeon run and minimap state round trip",
  );
}

export function runSaveMigrationChecks() {
  const migrated = migrateSaveData({ playerLevel: 2, hp: 17, activeQuestId: "quest-floor-1-memory-fragment", unlockedFloors: ["floor-1"] });
  check(migrated.success && migrated.data.version === 7 && migrated.data.player.gold === 0 && migrated.data.player.maxHp === 50, "v0 migration");
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
  const v5 = createSaveDataFromGameState(createInitialGameSaveState()) as unknown as Record<string, unknown>;
  v5.version = 5;
  v5.player = { ...(v5.player as Record<string, unknown>), defense: 2 };
  v5.inventory = {
    items: {
      ...(v5.inventory as { items: Record<string, number> }).items,
      "armor-gwanggaeto": 1,
    },
    equippedItemIds: {
      ...(v5.inventory as { equippedItemIds: Record<string, string | null> }).equippedItemIds,
      armor: "armor-gwanggaeto",
    },
  };
  const migratedV5 = migrateSaveData(v5);
  check(
    migratedV5.success &&
      migratedV5.migratedFromVersion === 5 &&
      migratedV5.data.player.maxHp === 55 &&
      !("defense" in migratedV5.data.player),
    "v5 removes defense and derives armor max HP",
  );
  const v6 = createSaveDataFromGameState(createInitialGameSaveState()) as unknown as Record<string, unknown>;
  v6.version = 6;
  v6.dungeon = {
    ...(v6.dungeon as Record<string, unknown>),
  };
  delete (v6.dungeon as Record<string, unknown>).currentFloorRun;
  const migratedV6 = migrateSaveData(v6);
  check(
    migratedV6.success &&
      migratedV6.migratedFromVersion === 6 &&
      migratedV6.data.dungeon.currentFloorRun === null,
    "v6 initializes dungeon run progress",
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
