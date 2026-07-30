import { createFloor1DungeonRun } from "./generation/floor1DungeonRuntime";
import {
  canEnterFinalRoom,
  getRequiredExplorationRoomIds,
  getUnresolvedExplorationRoomIds,
  isFinalRoom,
} from "./dungeonExplorationResolver";
import {
  completeRoomEvent,
  createInitialRoomProgress,
  restoreRoomProgress,
} from "./dungeonRoomProgress";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon exploration checks] ${message}`);
}

export function runDungeonExplorationChecks() {
  const run = createFloor1DungeonRun("phase23-exploration-seed");
  const initial = createInitialRoomProgress(run.map);
  check(initial[run.map.startRoomId]?.eventCompleted, "start room begins resolved");
  check(!canEnterFinalRoom(run.map, initial), "final room starts locked");
  check(
    getUnresolvedExplorationRoomIds(run.map, initial).length > 0,
    "unvisited rooms are detected",
  );

  const required = getRequiredExplorationRoomIds(run.map);
  const completed = required.reduce(completeRoomEvent, initial);
  check(canEnterFinalRoom(run.map, completed), "all rooms unlock final room");
  check(
    getUnresolvedExplorationRoomIds(run.map, completed).length === 0,
    "no unresolved rooms remain",
  );
  const finalRoom = run.map.rooms.find((room) => room.isFinalQuestRoom);
  check(finalRoom && isFinalRoom(run.map, finalRoom.id), "generated final room detected");

  const restored = restoreRoomProgress(run.map, completed);
  check(
    required.every((roomId) => restored[roomId]?.eventCompleted),
    "visited rooms restore",
  );
  const reset = restoreRoomProgress(run.map, undefined);
  check(!canEnterFinalRoom(run.map, reset), "new dungeon resets visits");
}
