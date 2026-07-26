import type { NormalCombatResolution } from "../combat/normalCombatResolver";
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
      { roomId: room.id, eventCompleted: false },
    ]),
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
  const current = progress[roomId];
  if (!current || current.eventCompleted) {
    return progress;
  }
  return {
    ...progress,
    [roomId]: { ...current, eventCompleted: true },
  };
}
