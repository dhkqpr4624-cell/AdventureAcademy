export type DungeonExitButtonStateInput = {
  failureState: "none" | "playerDefeated";
  isScreenTransitioning: boolean;
  isFloorClearTransitioning: boolean;
  exitConfirmOpen: boolean;
  isCameraMoving: boolean;
  isEnemyAttackAnimating: boolean;
  isAtomicResultProcessing: boolean;
};

export type DungeonExitButtonState = {
  visible: boolean;
  disabled: boolean;
};

export function resolveDungeonExitButtonState(
  input: DungeonExitButtonStateInput,
): DungeonExitButtonState {
  const visible =
    input.failureState !== "playerDefeated" &&
    !input.isScreenTransitioning &&
    !input.isFloorClearTransitioning;

  return {
    visible,
    disabled:
      !visible ||
      input.exitConfirmOpen ||
      input.isCameraMoving ||
      input.isEnemyAttackAnimating ||
      input.isAtomicResultProcessing,
  };
}
