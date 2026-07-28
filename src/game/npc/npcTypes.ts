import type { BaseCampNpcSlotId } from "./baseCampNpcSlots";

export type NpcId = "luna" | "theo" | "kaiden";

export type NpcDefinition = {
  id: NpcId;
  displayName: string;
  role: string;
  baseCampDisplayRole: string;
  baseCampSpawnId: BaseCampNpcSlotId;
  idle: {
    standingImage: string;
    blinkSpriteSheet: string;
    blinkFrameWidth: number;
    blinkFrameHeight: number;
    blinkFrameCount: number;
    blinkFrameDurationMs: number;
    minBlinkIntervalMs: number;
    maxBlinkIntervalMs: number;
    sourceSheetWidth?: number;
    sourceSheetHeight?: number;
  };
  portraits: {
    default: string;
    happy?: string;
    serious?: string;
    surprised?: string;
  };
  dialogue: {
    defaultStorySequenceId: string;
    questAvailableStorySequenceId?: string;
    questActiveStorySequenceId?: string;
    questCompletedStorySequenceId?: string;
  };
  offeredQuestIds: string[];
  placement: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
