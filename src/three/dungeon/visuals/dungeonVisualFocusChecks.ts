import * as THREE from "three";
import { createFloor1DungeonRun } from "../../../game/dungeon/generation/floor1DungeonRuntime";
import { assembleDungeonVisuals } from "./DungeonVisualAssembler";
import { FLOOR1_STANDARD_CORRIDOR } from "./corridorTemplates";
import { FLOOR1_STANDARD_ROOM } from "./roomVisualTemplates";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon visual focus check] ${message}`);
}
function texture() {
  return new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
}
function brightness(group: THREE.Group): number {
  const mesh = group.children.find((child) => child instanceof THREE.Mesh) as THREE.Mesh;
  return (mesh.material as THREE.MeshBasicMaterial).color.r;
}

export function runDungeonVisualFocusChecks(): void {
  const run = createFloor1DungeonRun("floor1-development-seed");
  const textures = { wall: texture(), floor: texture(), ceiling: texture() };
  const assembly = assembleDungeonVisuals({
    dungeonMap: run.map,
    roomTemplate: FLOOR1_STANDARD_ROOM,
    corridorTemplate: FLOOR1_STANDARD_CORRIDOR,
    textures,
  });
  const current = run.map.startRoomId;
  const connection = run.map.connections.find((item) =>
    item.fromRoomId === current || item.toRoomId === current,
  )!;
  const adjacent = connection.fromRoomId === current
    ? connection.toRoomId
    : connection.fromRoomId;
  const distant = run.map.rooms.find((room) => room.id !== current && room.id !== adjacent)!;
  assembly.setActiveRoom(current);
  check(brightness(assembly.roomGroups.get(current)!) === 1, "current room brightness is 1");
  check(brightness(assembly.corridorGroups.get(connection.id)!) === 0.62, "adjacent corridor is 0.62");
  check(brightness(assembly.roomGroups.get(adjacent)!) === 0.42, "adjacent room is 0.42");
  check(brightness(assembly.roomGroups.get(distant.id)!) === 0.22, "distant room is 0.22");
  assembly.setActiveRoom(adjacent);
  check(brightness(assembly.roomGroups.get(adjacent)!) === 1, "new current room becomes bright");
  check(
    textures.wall ===
      ((assembly.roomGroups.get(current)!.children[2] as THREE.Mesh)
        .material as THREE.MeshBasicMaterial).map,
    "texture object remains shared",
  );
  assembly.dispose();
  Object.values(textures).forEach((item) => item.dispose());
}
