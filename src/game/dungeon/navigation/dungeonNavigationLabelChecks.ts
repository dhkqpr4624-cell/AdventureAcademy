import type {
  DungeonRoomNode,
  TraversableDungeonConnection,
} from "../dungeonTypes";
import { labelDungeonNavigationRoutes } from "./dungeonNavigationLabelResolver";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon navigation label check] ${message}`);
}

const room = (id: string, x: number, z: number): DungeonRoomNode => ({
  id,
  type: "empty",
  position: { x, y: 0, z },
  facing: "north",
  explorationCameraPose: {
    position: [x, 0.2, z],
    lookAt: [x, 0, z - 4],
  },
});

export function runDungeonNavigationLabelChecks(): void {
  const rooms = [
    room("center", 0, 0),
    room("north", 0, -16),
    room("west", -16, 0),
    room("east", 16, 0),
    room("south", 0, 16),
  ];
  const routes = rooms.slice(1).map((target) => ({
    connection: {
      id: `connection-${target.id}`,
      fromRoomId: "center",
      toRoomId: target.id,
      directionFromSource: "forward",
      directionFromTarget: "back",
      cameraPath: [],
    },
    targetRoomId: target.id,
    direction: "forward",
    cameraPath: [],
  })) as TraversableDungeonConnection[];
  const labeled = labelDungeonNavigationRoutes({
    currentRoom: rooms[0],
    routes,
    previousRoomId: "south",
    getRoom: (id) => rooms.find((candidate) => candidate.id === id)!,
  });
  check(labeled.find((route) => route.targetRoomId === "north")?.direction === "forward", "north is forward");
  check(labeled.find((route) => route.targetRoomId === "west")?.direction === "left", "west is left");
  check(labeled.find((route) => route.targetRoomId === "east")?.direction === "right", "east is right");
  check(labeled.find((route) => route.targetRoomId === "south")?.direction === "back", "previous room alone is back");
  check(labeled.filter((route) => route.direction === "back").length === 1, "at most one back route");
  check(new Set(labeled.map((route) => route.direction)).size === labeled.length, "labels are unique");
}
