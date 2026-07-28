export const BASE_CAMP_NPC_DISPLAY_SCALE = 0.6;
export const BASE_CAMP_NPC_UPWARD_SHIFT = 43;

export const BASE_CAMP_NPC_SLOT_IDS = {
  lunaOriginal: "lunaNpc",
  theoOriginal: "theoNpc",
  kaidenOriginal: "kaidenNpc",
} as const;

export type BaseCampNpcSlotId =
  (typeof BASE_CAMP_NPC_SLOT_IDS)[keyof typeof BASE_CAMP_NPC_SLOT_IDS];

export type BaseCampNpcSlot = {
  id: BaseCampNpcSlotId;
  anchorX: number;
  previousAnchorY: number;
  baseWidth: number;
  baseHeight: number;
  focusPointId: BaseCampNpcSlotId;
};

export const BASE_CAMP_NPC_SLOTS: Record<
  BaseCampNpcSlotId,
  BaseCampNpcSlot
> = {
  lunaNpc: {
    id: "lunaNpc",
    anchorX: 495,
    previousAnchorY: 795,
    baseWidth: 190,
    baseHeight: 300,
    focusPointId: "lunaNpc",
  },
  theoNpc: {
    id: "theoNpc",
    anchorX: 605,
    previousAnchorY: 795,
    baseWidth: 190,
    baseHeight: 300,
    focusPointId: "theoNpc",
  },
  kaidenNpc: {
    id: "kaidenNpc",
    anchorX: 1395,
    previousAnchorY: 795,
    baseWidth: 190,
    baseHeight: 300,
    focusPointId: "kaidenNpc",
  },
};

export const BASE_CAMP_NPC_SLOT_ASSIGNMENTS = {
  luna: BASE_CAMP_NPC_SLOT_IDS.kaidenOriginal,
  theo: BASE_CAMP_NPC_SLOT_IDS.lunaOriginal,
  kaiden: BASE_CAMP_NPC_SLOT_IDS.theoOriginal,
} as const;

export function getBaseCampNpcPlacement(slotId: BaseCampNpcSlotId) {
  const slot = BASE_CAMP_NPC_SLOTS[slotId];
  const width = slot.baseWidth * BASE_CAMP_NPC_DISPLAY_SCALE;
  const height = slot.baseHeight * BASE_CAMP_NPC_DISPLAY_SCALE;
  const anchorY = slot.previousAnchorY - BASE_CAMP_NPC_UPWARD_SHIFT;

  return {
    x: slot.anchorX - width / 2,
    y: anchorY - height,
    width,
    height,
  };
}

export function getBaseCampNpcFocusTarget(slotId: BaseCampNpcSlotId) {
  const slot = BASE_CAMP_NPC_SLOTS[slotId];
  const placement = getBaseCampNpcPlacement(slotId);

  return {
    x: slot.anchorX,
    y: placement.y + placement.height / 2,
  };
}
