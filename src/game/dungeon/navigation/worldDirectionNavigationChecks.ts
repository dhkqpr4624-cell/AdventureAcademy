import type {
  DungeonRoomNode,
  TraversableDungeonConnection,
  WorldCardinalDirection,
} from "../dungeonTypes";
import {
  labelDungeonNavigationRoutes,
  navigationLabelFromWorldDirection,
} from "./dungeonNavigationLabelResolver";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[world direction navigation check] ${message}`);
}

const room = (id: string, x: number, z: number): DungeonRoomNode => ({
  id,
  type: "empty",
  position: { x, y: 0, z },
  facing: "north",
  explorationCameraPose: {
    position: [x, 0.2, z],
    lookAt: [x, 0.2, z - 4],
  },
});

export function runWorldDirectionNavigationChecks(): void {
  const expected = {
    north: "forward",
    west: "left",
    east: "right",
    south: "back",
  } as const;
  for (const [worldDirection, label] of Object.entries(expected)) {
    check(
      navigationLabelFromWorldDirection(
        worldDirection as WorldCardinalDirection,
      ) === label,
      `${worldDirection} maps to ${label}`,
    );
  }

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
  const resolve = () =>
    labelDungeonNavigationRoutes({
      currentRoom: rooms[0],
      routes,
      getRoom: (id) => rooms.find((candidate) => candidate.id === id)!,
    });
  const firstVisit = resolve();
  const revisit = resolve();
  check(
    firstVisit.every(
      (route, index) => route.direction === revisit[index].direction,
    ),
    "the same room keeps the same labels on every visit",
  );
  check(
    new Set(firstVisit.map((route) => route.direction)).size ===
      firstVisit.length,
    "each absolute direction appears at most once",
  );
}
