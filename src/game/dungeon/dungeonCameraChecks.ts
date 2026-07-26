import * as THREE from "three";
import {
  getCameraForwardFromYaw,
  getYawFromDirection,
} from "../../three/dungeon/DungeonCameraController";
import { getConnectionsForRoom, TEST_DUNGEON_MAP } from "./testDungeonMap";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[dungeonCameraChecks] ${message}`);
  }
}

function checkRoute(roomId: string, targetRoomId: string): void {
  const route = getConnectionsForRoom(roomId).find(
    (candidate) => candidate.targetRoomId === targetRoomId,
  );
  check(Boolean(route), `${roomId} -> ${targetRoomId} must exist`);
  if (!route) {
    return;
  }
  const start = TEST_DUNGEON_MAP.rooms.find((room) => room.id === roomId);
  check(Boolean(start), `unknown start room ${roomId}`);
  if (!start) {
    return;
  }
  const positions = [
    new THREE.Vector3(...start.explorationCameraPose.position),
    ...route.cameraPath.map((point) => new THREE.Vector3(...point.position)),
  ];
  for (let index = 0; index < positions.length - 1; index += 1) {
    const movement = positions[index + 1].clone().sub(positions[index]).normalize();
    if (movement.lengthSq() === 0) {
      continue;
    }
    const yaw = getYawFromDirection(positions[index], positions[index + 1]);
    const forward = getCameraForwardFromYaw(yaw);
    check(
      forward.dot(movement) > 0.999,
      `${roomId} -> ${targetRoomId} camera must face movement`,
    );
  }
}

function checkBackwardRoute(roomId: string, targetRoomId: string): void {
  const route = getConnectionsForRoom(roomId).find(
    (candidate) => candidate.targetRoomId === targetRoomId,
  );
  check(Boolean(route), `${roomId} -> ${targetRoomId} must exist`);
  if (!route) {
    return;
  }
  check(route.direction === "back", `${roomId} -> ${targetRoomId} must be back`);
  const start = TEST_DUNGEON_MAP.rooms.find((room) => room.id === roomId);
  const destination = TEST_DUNGEON_MAP.rooms.find(
    (room) => room.id === targetRoomId,
  );
  check(Boolean(start && destination), "backward route rooms must exist");
  if (!start || !destination) {
    return;
  }
  const startPosition = new THREE.Vector3(...start.explorationCameraPose.position);
  const firstPosition = new THREE.Vector3(...route.cameraPath[0].position);
  const movement = firstPosition.sub(startPosition).normalize();
  const startYaw = getYawFromDirection(
    new THREE.Vector3(...start.explorationCameraPose.position),
    new THREE.Vector3(...start.explorationCameraPose.lookAt),
  );
  check(
    getCameraForwardFromYaw(startYaw).dot(movement) < -0.999,
    `${roomId} -> ${targetRoomId} must begin by moving backward`,
  );
  const finalPoint = route.cameraPath[route.cameraPath.length - 1];
  check(
    finalPoint.position.every(
      (coordinate, index) =>
        Math.abs(coordinate - destination.explorationCameraPose.position[index]) <
        Number.EPSILON,
    ),
    `${roomId} -> ${targetRoomId} must end at exploration position`,
  );
  check(
    finalPoint.lookAt?.every(
      (coordinate, index) =>
        Math.abs(coordinate - destination.explorationCameraPose.lookAt[index]) <
        Number.EPSILON,
    ) === true,
    `${roomId} -> ${targetRoomId} must carry the destination exploration lookAt`,
  );
}

function routeMetrics(roomId: string, targetRoomId: string) {
  const route = getConnectionsForRoom(roomId).find(
    (candidate) => candidate.targetRoomId === targetRoomId,
  );
  const room = TEST_DUNGEON_MAP.rooms.find((candidate) => candidate.id === roomId);
  check(Boolean(route && room), `${roomId} -> ${targetRoomId} comparison route exists`);
  if (!route || !room) {
    throw new Error("[dungeonCameraChecks] missing comparison route");
  }
  const positions = [
    new THREE.Vector3(...room.explorationCameraPose.position),
    ...route.cameraPath.map((point) => new THREE.Vector3(...point.position)),
  ];
  return {
    kinds: route.cameraPath.map((point) => point.kind),
    lengths: positions.slice(1).map((position, index) =>
      position.distanceTo(positions[index]),
    ),
  };
}

function checkMatchingSidePaths(
  eventRoomId: string,
  eventTargetId: string,
  combatRoomId: string,
  combatTargetId: string,
): void {
  const event = routeMetrics(eventRoomId, eventTargetId);
  const combat = routeMetrics(combatRoomId, combatTargetId);
  check(
    event.kinds.join("|") === combat.kinds.join("|"),
    `${eventTargetId} must use the normal side-path point roles`,
  );
  check(
    event.lengths.length === combat.lengths.length &&
      event.lengths.every(
        (length, index) => Math.abs(length - combat.lengths[index]) < 0.0001,
      ),
    `${eventTargetId} must use the normal side-path segment distances`,
  );
}

export function runDungeonCameraChecks(): void {
  checkRoute("room-empty-a", "room-combat-a");
  checkRoute("room-empty-b", "room-combat-b");
  checkRoute("room-empty-a", "room-treasure");
  checkRoute("room-empty-b", "room-trap");
  checkMatchingSidePaths(
    "room-empty-a",
    "room-treasure",
    "room-empty-b",
    "room-combat-b",
  );
  checkMatchingSidePaths(
    "room-empty-b",
    "room-trap",
    "room-empty-a",
    "room-combat-a",
  );
  checkBackwardRoute("room-combat-a", "room-empty-a");
  checkBackwardRoute("room-combat-b", "room-empty-b");
  for (const connection of TEST_DUNGEON_MAP.connections) {
    check(connection.cameraPath.length >= 4, `${connection.id} path is too short`);
  }
  console.info("dungeon camera checks: PASS");
}
