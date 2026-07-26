import type {
  DungeonMapDefinition,
  DungeonRoomProgress,
} from "./dungeonTypes";

export type DungeonCompletionCheck = {
  canComplete: boolean;
  remainingCombatRoomIds: string[];
};

export function resolveDungeonCompletion(
  map: DungeonMapDefinition,
  roomProgress: Record<string, DungeonRoomProgress>,
): DungeonCompletionCheck {
  const remainingCombatRoomIds = map.rooms
    .filter((room) => room.type === "combat")
    .filter((room) => roomProgress[room.id]?.eventCompleted !== true)
    .map((room) => room.id);
  return {
    canComplete: remainingCombatRoomIds.length === 0,
    remainingCombatRoomIds,
  };
}
