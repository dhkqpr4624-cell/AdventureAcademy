import { resolveDungeonExitButtonState } from "./dungeonExitButtonResolver";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon exit button check] ${message}`);
}

const idle = {
  failureState: "none" as const,
  isScreenTransitioning: false,
  isFloorClearTransitioning: false,
  exitConfirmOpen: false,
  isCameraMoving: false,
  isEnemyAttackAnimating: false,
  isAtomicResultProcessing: false,
};

export function runDungeonExitButtonChecks(): void {
  for (const phase of [
    "exploration",
    "question",
    "review",
    "playerCommand",
    "perfectVictory",
    "enemyEscaped",
    "treasureResult",
    "trapResult",
    "completedRoom",
  ]) {
    const state = resolveDungeonExitButtonState(idle);
    check(state.visible && !state.disabled, `${phase} stays usable`);
  }
  check(
    resolveDungeonExitButtonState({ ...idle, isCameraMoving: true }).visible &&
      resolveDungeonExitButtonState({ ...idle, isCameraMoving: true }).disabled,
    "camera movement keeps the button visible but disabled",
  );
  check(
    resolveDungeonExitButtonState({ ...idle, isEnemyAttackAnimating: true })
      .disabled,
    "enemy impact disables the button",
  );
  check(
    !resolveDungeonExitButtonState({
      ...idle,
      failureState: "playerDefeated",
    }).visible,
    "defeat hides the button",
  );
  check(
    !resolveDungeonExitButtonState({ ...idle, isScreenTransitioning: true })
      .visible,
    "screen transition hides the button",
  );
  check(
    resolveDungeonExitButtonState({ ...idle, exitConfirmOpen: true }).visible &&
      resolveDungeonExitButtonState({ ...idle, exitConfirmOpen: true }).disabled,
    "confirmation modal keeps the button disabled behind the modal",
  );
}
