export type DungeonEventVisualPlacement = {
  verticalOffset: number;
  overlayTranslateYPercent: number;
  scaleMultiplier: number;
  anchorX: number;
  anchorY: number;
};

export const DUNGEON_EVENT_VISUAL_PLACEMENT: Readonly<DungeonEventVisualPlacement> =
  Object.freeze({
    verticalOffset: 0.62,
    overlayTranslateYPercent: -10,
    scaleMultiplier: 1,
    anchorX: 0.5,
    anchorY: 0.5,
  });

export function applyDungeonEventVisualVerticalOffset(
  position: readonly [number, number, number],
): [number, number, number] {
  return [
    position[0],
    position[1] + DUNGEON_EVENT_VISUAL_PLACEMENT.verticalOffset,
    position[2],
  ];
}
