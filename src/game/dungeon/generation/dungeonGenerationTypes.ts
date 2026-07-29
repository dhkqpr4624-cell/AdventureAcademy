import type {
  DungeonConnection,
  DungeonDirection,
  DungeonMapDefinition,
  DungeonRoomNode,
  DungeonRoomType,
} from "../dungeonTypes";

export type MapTemplateId = "floor1-branch-a" | "floor1-branch-b";

export type MapTemplateRoomSlot = {
  id: string;
  position: { x: number; y: number; z: number };
  allowedRoomTypes: DungeonRoomType[];
  required?: boolean;
  fixedRoomType?: DungeonRoomType;
  tags?: string[];
};

export type CameraPathTemplateId =
  | "straight"
  | "branch-left"
  | "branch-right";

export type MapTemplateConnectionCandidate = {
  id: string;
  fromSlotId: string;
  toSlotId: string;
  directionFrom: DungeonDirection;
  directionTo: DungeonDirection;
  required?: boolean;
  optionalWeight?: number;
  cameraPathTemplateId: CameraPathTemplateId;
};

export type MapTemplate = {
  id: MapTemplateId;
  floorId: string;
  slots: MapTemplateRoomSlot[];
  connectionCandidates: MapTemplateConnectionCandidate[];
  constraints: {
    minRoomCount: number;
    maxRoomCount: number;
    maxDeadEnds: number;
    maxCycleCount: number;
  };
};

export type DungeonGenerationConfig = {
  floorId: string;
  minRoomCount: number;
  maxRoomCount: number;
  requiredRoomCounts: Partial<Record<DungeonRoomType, number>>;
  maximumRoomCounts: Partial<Record<DungeonRoomType, number>>;
  requireTreasureOrTrap: boolean;
  maxDeadEnds: number;
  maxNonPurposeDeadEnds: number;
  maxCycleCount: number;
  minFinalRoomDistance: number;
  questionBudget: { min: number; max: number };
  maxGenerationAttempts: number;
};

export type DungeonQuestionSetPool = {
  normalCombat: string[];
  eliteCombat: string[];
  treasure: string[];
  trap: string[];
};

export type GeneratedDungeon = DungeonMapDefinition & {
  generationId: string;
  floorId: string;
  templateId: MapTemplateId;
  seed: string;
  finalQuestRoomId: string;
  source: "generated";
  metadata: {
    roomCount: number;
    deadEndCount: number;
    cycleCount: number;
    questionBudgetUsed: number;
    generationAttempt: number;
  };
};

export type DungeonValidationErrorCode =
  | "missingStartRoom"
  | "multipleStartRooms"
  | "missingFinalQuestRoom"
  | "multipleFinalQuestRooms"
  | "finalRoomTooClose"
  | "finalRoomUnreachable"
  | "requiredRoomUnreachable"
  | "isolatedComponent"
  | "missingNormalCombat"
  | "missingTreasureOrTrap"
  | "tooManyTreasureRooms"
  | "tooManyTrapRooms"
  | "roomCountOutOfRange"
  | "questionBudgetBelowMinimum"
  | "questionBudgetExceeded"
  | "tooManyDeadEnds"
  | "tooManyNonPurposeDeadEnds"
  | "tooManyCycles"
  | "duplicateRoomId"
  | "duplicateConnectionId"
  | "duplicateRoomConnection"
  | "invalidConnectionTarget"
  | "selfConnection"
  | "invalidCameraPath"
  | "invalidQuestionSetReference"
  | "invalidMonsterReference"
  | "invalidEventConfig"
  | "duplicateNavigationDirection"
  | "multipleBackRoutes"
  | "unsupportedRearConnection";

export type DungeonValidationError = {
  code: DungeonValidationErrorCode;
  roomId?: string;
  connectionId?: string;
  detail?: string;
};

export type DungeonValidationMetrics = {
  roomCount: number;
  reachableRoomCount: number;
  shortestPathToFinal: number | null;
  deadEndCount: number;
  nonPurposeDeadEndCount: number;
  cycleCount: number;
  questionBudgetUsed: number;
};

export type DungeonValidationResult = {
  valid: boolean;
  errors: DungeonValidationError[];
  metrics: DungeonValidationMetrics;
};

export type DungeonGenerationResult =
  | { success: true; dungeon: GeneratedDungeon }
  | {
      success: false;
      reason: "generationAttemptsExceeded";
      validationErrors: DungeonValidationError[];
    };

export type DungeonGenerationInput = {
  templates: readonly MapTemplate[];
  config: DungeonGenerationConfig;
  seed: number | string;
  questionSetPool: DungeonQuestionSetPool;
};

export type DungeonValidationInput = {
  dungeon: DungeonMapDefinition & {
    finalQuestRoomId?: string;
  };
  template?: MapTemplate;
  config: DungeonGenerationConfig;
};

export type GeneratedRoomAndConnections = {
  rooms: DungeonRoomNode[];
  connections: DungeonConnection[];
};
