export type DungeonRoomType = "start" | "empty" | "combat";

export type DungeonDirection = "forward" | "left" | "right" | "back";

export type DungeonFacing = "north" | "east" | "south" | "west";

export type DungeonVector3 = [number, number, number];

export type DungeonCameraPathPoint = {
  position: DungeonVector3;
  rotationY?: number;
  duration?: number;
};

export type DungeonCameraPoint = {
  position: DungeonVector3;
  lookAt: DungeonVector3;
  rotationY: number;
};

export type DungeonRoomNode = {
  id: string;
  type: DungeonRoomType;
  position: {
    x: number;
    y: number;
    z: number;
  };
  facing: DungeonFacing;
  cameraPoint: DungeonCameraPoint;
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
