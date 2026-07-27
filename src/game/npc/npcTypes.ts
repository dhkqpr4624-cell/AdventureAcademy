export type NpcDefinition = {
  id: string;
  displayName: string;
  role: string;
  baseCampSpawnId: string;
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

