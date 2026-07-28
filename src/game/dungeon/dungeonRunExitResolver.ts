export type DungeonRunExitReason =
  | "voluntary"
  | "defeatedRetry"
  | "defeatedReturnToBaseCamp";

export type DungeonRunExitPolicy = {
  resetRoomProgress: true;
  restoreHpToMax: boolean;
  returnToBaseCamp: boolean;
  marksFloorCleared: false;
  preservesQuestAndFloorState: true;
};

export function resolveDungeonRunExitPolicy(
  reason: DungeonRunExitReason,
): DungeonRunExitPolicy {
  return {
    resetRoomProgress: true,
    restoreHpToMax: reason !== "voluntary",
    returnToBaseCamp: reason !== "defeatedRetry",
    marksFloorCleared: false,
    preservesQuestAndFloorState: true,
  };
}
