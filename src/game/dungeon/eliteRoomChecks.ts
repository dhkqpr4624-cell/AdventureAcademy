import { ELITE_ENEMY_ATTACK_DAMAGE } from "../combat/eliteCombatResolver";
import { getMonsterVisualDefinition } from "../monster/monsterDefinitions";
import { resolveRoomEntry } from "./RoomEventController";
import { getDungeonQuestionSet } from "./dungeonQuestionSets";
import {
  completeRoomEvent,
  createInitialRoomProgress,
  shouldCompleteEliteRoom,
} from "./dungeonRoomProgress";
import { getConnectionsForRoom, TEST_DUNGEON_MAP } from "./testDungeonMap";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[eliteRoomChecks] ${message}`);
  }
}

export function runEliteRoomChecks(): void {
  const eliteRooms = TEST_DUNGEON_MAP.rooms.filter((room) => room.type === "elite");
  check(eliteRooms.length === 1, "test map must contain exactly one elite room");
  const room = eliteRooms[0];
  check(Boolean(room.eliteConfig), "eliteConfig is required");
  const config = room.eliteConfig!;
  check(Boolean(config.monsterId), "monsterId is required");
  check(Boolean(config.questionSetId), "questionSetId is required");
  check(
    config.attackDamage === ELITE_ENEMY_ATTACK_DAMAGE,
    "elite attack damage must be 8",
  );
  check(
    getDungeonQuestionSet(config.questionSetId, 3).length === 3,
    "elite question set must contain exactly 3 questions",
  );
  const visual = getMonsterVisualDefinition(config.monsterId);
  check(visual.image.endsWith(".png"), "elite PNG asset must resolve");
  check(visual.displayScale >= 1.1 && visual.displayScale <= 1.25, "scale must be safe");
  check(
    getConnectionsForRoom(room.id).length > 0,
    "elite room must be connected",
  );
  const eliteConnection = TEST_DUNGEON_MAP.connections.find(
    (connection) => connection.toRoomId === room.id || connection.fromRoomId === room.id,
  );
  check(Boolean(eliteConnection?.cameraPath.length), "elite cameraPath is required");
  const initial = createInitialRoomProgress(TEST_DUNGEON_MAP);
  check(
    resolveRoomEntry(room, initial[room.id]).type === "startEliteCombat",
    "first visit must start elite combat",
  );
  check(
    shouldCompleteEliteRoom("enemyEscaped"),
    "enemyEscaped must complete elite room",
  );
  const completed = completeRoomEvent(initial, room.id);
  check(
    resolveRoomEntry(room, completed[room.id]).type === "skipCompletedCombat",
    "completed elite room must not restart",
  );
  const reset = createInitialRoomProgress(TEST_DUNGEON_MAP);
  check(!reset[room.id].eventCompleted, "dungeon reset must reactivate elite room");
  console.info("elite room checks: PASS");
}
