import { createFloor1DungeonRun } from "../generation/floor1DungeonRuntime";
import { getDungeonRoomFromMap } from "../dungeonRuntimeMap";
import type { TraversableDungeonConnection } from "../dungeonTypes";
import {
  DUNGEON_CANONICAL_YAW,
  buildDungeonNavigationPath,
  finalYawForNavigationPath,
} from "./dungeonNavigationPathBuilder";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon navigation path check] ${message}`);
}

export function runDungeonNavigationPathChecks(): void {
  const run = createFloor1DungeonRun("floor1-development-seed");
  const source = getDungeonRoomFromMap(run.map, "room-junction-a");
  for (const targetId of ["room-east-a", "room-west-a"]) {
    const target = getDungeonRoomFromMap(run.map, targetId);
    const route = {
      connection: run.map.connections.find((connection) =>
        [connection.fromRoomId, connection.toRoomId].includes(targetId) &&
        [connection.fromRoomId, connection.toRoomId].includes(source.id),
      )!,
      targetRoomId: targetId,
      direction: targetId.includes("east") ? "right" : "left",
      cameraPath: [],
    } as TraversableDungeonConnection;
    const steps = buildDungeonNavigationPath({
      sourceRoom: source,
      targetRoom: target,
      route,
    });
    check(steps[0].type === "rotate", `${targetId}: rotates at junction`);
    check(
      steps[0].type === "rotate" &&
        Math.abs(Math.abs(steps[0].yaw) - Math.PI / 2) < 1e-9,
      `${targetId}: first turn is exactly 90 degrees`,
    );
    check(steps[1].type === "move", `${targetId}: corridor move follows turn`);
    check(
      steps[2].type === "rotate" && steps[2].yaw === DUNGEON_CANONICAL_YAW,
      `${targetId}: final turn restores canonical yaw`,
    );
    check(
      finalYawForNavigationPath(steps) === DUNGEON_CANONICAL_YAW,
      `${targetId}: final yaw is canonical`,
    );
  }

  const north = getDungeonRoomFromMap(run.map, "room-junction-b");
  const straight = buildDungeonNavigationPath({
    sourceRoom: source,
    targetRoom: north,
    route: {} as TraversableDungeonConnection,
  });
  check(straight.length === 1 && straight[0].type === "move", "forward is straight");

  const backward = buildDungeonNavigationPath({
    sourceRoom: north,
    targetRoom: source,
    route: {} as TraversableDungeonConnection,
  });
  check(
    !(backward[0].type === "rotate" && Math.abs(backward[0].yaw) === Math.PI),
    "backward has no starting 180 degree turn",
  );
  check(
    backward.some(
      (step) => step.type === "move" && step.movementMode === "backward",
    ),
    "backward step is marked as reverse movement",
  );
}
