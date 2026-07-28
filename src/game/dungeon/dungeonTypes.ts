export type DungeonRoomType =
  | "start"
  | "empty"
  | "combat"
  | "elite"
  | "treasure"
  | "trap"
  | "quest";

export type DungeonDirection = "forward" | "left" | "right" | "back";

export type DungeonFacing = "north" | "east" | "south" | "west";

export type DungeonVector3 = [number, number, number];

export type DungeonCameraPathPointKind =
  | "roomCenter"
  | "roomExit"
  | "junction"
  | "corridor"
  | "roomEntrance";

export type DungeonCameraPathPoint = {
  kind?: DungeonCameraPathPointKind;
  position: DungeonVector3;
  lookAt?: DungeonVector3;
  rotationY?: number;
  duration?: number;
};

export type DungeonCameraPose = {
  position: DungeonVector3;
  lookAt: DungeonVector3;
  rotationY?: number;
};

export type DungeonCombatConfig = {
  monsterId: string;
  questionSetId: string;
  monsterPosition: DungeonVector3;
  combatCameraPose: DungeonCameraPose;
};

export type DungeonEliteConfig = {
  monsterId: string;
  questionSetId: string;
  attackDamage: 8;
  monsterPosition: DungeonVector3;
  combatCameraPose: DungeonCameraPose;
};

export type DungeonTreasureEventConfig = {
  treasureId: string;
  questionSetId: string;
  rewardId: string;
};

export type DungeonTrapEventConfig = {
  questionSetId: string;
  damage: number;
};

export type DungeonRoomEventConfig =
  | DungeonTreasureEventConfig
  | DungeonTrapEventConfig;

export type DungeonRoomNode = {
  id: string;
  type: DungeonRoomType;
  position: {
    x: number;
    y: number;
    z: number;
  };
  facing: DungeonFacing;
  explorationCameraPose: DungeonCameraPose;
  combatConfig?: DungeonCombatConfig;
  eliteConfig?: DungeonEliteConfig;
  eventConfig?: DungeonRoomEventConfig;
  isRequired?: boolean;
  isFinalQuestRoom?: boolean;
};

export type DungeonConnection = {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  directionFromSource: DungeonDirection;
  directionFromTarget: DungeonDirection;
  cameraPath: DungeonCameraPathPoint[];
};

export type DungeonRoomProgress = {
  roomId: string;
  eventCompleted: boolean;
  eventResult?:
    | "treasureOpened"
    | "treasureLocked"
    | "trapAvoided"
    | "trapTriggered";
};

export type DungeonMapDefinition = {
  startRoomId: string;
  rooms: DungeonRoomNode[];
  connections: DungeonConnection[];
};

export type TraversableDungeonConnection = {
  connection: DungeonConnection;
  targetRoomId: string;
  direction: DungeonDirection;
  cameraPath: DungeonCameraPathPoint[];
};
