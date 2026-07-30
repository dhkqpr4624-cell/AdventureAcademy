import type {
  DungeonMapDefinition,
  DungeonRoomProgress,
} from "./dungeonTypes";

export type DungeonCompletionCheck = {
  canComplete: boolean;
  remainingCombatRoomIds: string[];
  remainingRequiredRoomIds: string[];
};

export function resolveDungeonCompletion(
  map: DungeonMapDefinition,
  roomProgress: Record<string, DungeonRoomProgress>,
): DungeonCompletionCheck {
  const remainingCombatRoomIds = map.rooms
    .filter((room) => room.type === "combat" || room.type === "elite")
    .filter((room) => roomProgress[room.id]?.eventCompleted !== true)
    .map((room) => room.id);
  const remainingRequiredRoomIds = map.rooms
    .filter((room) => room.type !== "start" && !room.isFinalQuestRoom)
    .filter((room) => roomProgress[room.id]?.eventCompleted !== true)
    .map((room) => room.id);
  return {
    canComplete: remainingRequiredRoomIds.length === 0,
    remainingCombatRoomIds,
    remainingRequiredRoomIds,
  };
}
