import type { NormalCombatResolution } from "../combat/normalCombatResolver";
import type { EliteCombatResult } from "../combat/eliteCombatResolver";
import type {
  DungeonMapDefinition,
  DungeonRoomProgress,
} from "./dungeonTypes";

export function createInitialRoomProgress(
  map: DungeonMapDefinition,
): Record<string, DungeonRoomProgress> {
  return Object.fromEntries(
    map.rooms.map((room) => [
      room.id,
      { roomId: room.id, eventCompleted: room.type === "start" },
    ]),
  );
}

export function restoreRoomProgress(
  map: DungeonMapDefinition,
  saved: Record<string, DungeonRoomProgress> | undefined,
): Record<string, DungeonRoomProgress> {
  const initial = createInitialRoomProgress(map);
  if (!saved) return initial;
  return Object.fromEntries(
    map.rooms.map((room) => {
      const value = saved[room.id];
      return [
        room.id,
        value?.roomId === room.id
          ? {
              roomId: room.id,
              eventCompleted:
                room.type === "start" ? true : value.eventCompleted === true,
              ...(value.eventResult ? { eventResult: value.eventResult } : {}),
            }
          : initial[room.id],
      ];
    }),
  );
}

export function shouldCompleteEliteRoom(
  result: EliteCombatResult,
): boolean {
  return (
    result === "perfectVictory" ||
    result === "normalVictory" ||
    result === "hardVictory" ||
    result === "enemyEscaped"
  );
}

export function shouldCompleteCombatRoom(
  outcome: NormalCombatResolution["outcome"],
): boolean {
  return (
    outcome === "perfectVictory" ||
    outcome === "hardVictory" ||
    outcome === "enemyEscaped"
  );
}

export function completeRoomEvent(
  progress: Record<string, DungeonRoomProgress>,
  roomId: string,
): Record<string, DungeonRoomProgress> {
  return completeRoomEventWithResult(progress, roomId);
}

export function completeRoomEventWithResult(
  progress: Record<string, DungeonRoomProgress>,
  roomId: string,
  eventResult?: DungeonRoomProgress["eventResult"],
): Record<string, DungeonRoomProgress> {
  const current = progress[roomId];
  if (!current || current.eventCompleted) {
    return progress;
  }
  return {
    ...progress,
    [roomId]: { ...current, eventCompleted: true, eventResult },
  };
}
