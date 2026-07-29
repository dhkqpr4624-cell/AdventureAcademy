import {
  DUNGEON_EVENT_VISUAL_PLACEMENT,
  applyDungeonEventVisualVerticalOffset,
} from "./dungeonEventVisualPlacement";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon event visual placement check] ${message}`);
}

export function runDungeonEventVisualPlacementChecks(): void {
  const source = [3, 0.05, -8] as const;
  const once = applyDungeonEventVisualVerticalOffset(source);
  check(
    once[1] === source[1] + DUNGEON_EVENT_VISUAL_PLACEMENT.verticalOffset,
    "the common world offset is applied once",
  );
  check(once[0] === source[0] && once[2] === source[2], "only Y changes");
  check(
    DUNGEON_EVENT_VISUAL_PLACEMENT.overlayTranslateYPercent === -10,
    "overlay visuals use the common ten-percent upward shift",
  );
  check(
    DUNGEON_EVENT_VISUAL_PLACEMENT.scaleMultiplier === 1,
    "existing monster and elite relative scale is preserved",
  );
  check(
    applyDungeonEventVisualVerticalOffset(source)[1] === once[1],
    "placement is derived from the source and never accumulates",
  );
}
