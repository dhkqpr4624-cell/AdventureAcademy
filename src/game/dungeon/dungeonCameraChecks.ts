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

export function runDungeonCameraChecks(): void {
  checkRoute("room-empty-a", "room-combat-a");
  checkRoute("room-empty-b", "room-combat-b");
  checkRoute("room-combat-a", "room-empty-a");
  for (const connection of TEST_DUNGEON_MAP.connections) {
    check(connection.cameraPath.length >= 4, `${connection.id} path is too short`);
  }
  console.info("dungeon camera checks: PASS");
}
