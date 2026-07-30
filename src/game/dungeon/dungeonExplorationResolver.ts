import type {
  DungeonMapDefinition,
  DungeonRoomProgress,
} from "./dungeonTypes";

export function getRequiredExplorationRoomIds(
  map: DungeonMapDefinition,
): string[] {
  return map.rooms
    .filter((room) => room.type !== "start" && !room.isFinalQuestRoom)
    .map((room) => room.id);
}

export function getUnresolvedExplorationRoomIds(
  map: DungeonMapDefinition,
  progress: Record<string, DungeonRoomProgress>,
): string[] {
  return getRequiredExplorationRoomIds(map).filter(
    (roomId) => progress[roomId]?.eventCompleted !== true,
  );
}

export function canEnterFinalRoom(
  map: DungeonMapDefinition,
  progress: Record<string, DungeonRoomProgress>,
): boolean {
  return getUnresolvedExplorationRoomIds(map, progress).length === 0;
}

export function isFinalRoom(
  map: DungeonMapDefinition,
  roomId: string,
): boolean {
  return map.rooms.some(
    (room) => room.id === roomId && room.isFinalQuestRoom === true,
  );
}
