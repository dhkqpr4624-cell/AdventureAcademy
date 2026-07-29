import * as THREE from "three";
import { createFloor1DungeonRun } from "../../../game/dungeon/generation/floor1DungeonRuntime";
import { assembleDungeonVisuals } from "./DungeonVisualAssembler";
import { FLOOR1_STANDARD_CORRIDOR } from "./corridorTemplates";
import { FLOOR1_STANDARD_ROOM } from "./roomVisualTemplates";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon visual check] ${message}`);
}

function texture() {
  const result = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  result.needsUpdate = true;
  return result;
}

export function runDungeonVisualChecks(): void {
  for (const seed of ["visual-template-a", "visual-template-b", "floor1-development-seed"]) {
    const run = createFloor1DungeonRun(seed);
    const textures = { wall: texture(), floor: texture(), ceiling: texture() };
    const assembly = assembleDungeonVisuals({
      dungeonMap: run.map,
      roomTemplate: FLOOR1_STANDARD_ROOM,
      corridorTemplate: FLOOR1_STANDARD_CORRIDOR,
      textures,
    });
    check(assembly.roomGroups.size === run.map.rooms.length, `${seed}: every room assembled`);
    check(assembly.corridorGroups.size === run.map.connections.length, `${seed}: one corridor per connection`);
    check(assembly.passageSockets.length === run.map.connections.length * 2, `${seed}: two sockets per connection`);
    for (const connection of run.map.connections) {
      const source = run.map.rooms.find((room) => room.id === connection.fromRoomId)!;
      const target = run.map.rooms.find((room) => room.id === connection.toRoomId)!;
      const spacing = Math.hypot(target.position.x - source.position.x, target.position.z - source.position.z);
      check(spacing - FLOOR1_STANDARD_ROOM.width > 0, `${connection.id}: corridor length is positive`);
      check(connection.cameraPath.length >= 4, `${connection.id}: camera path retained`);
    }
    assembly.dispose();
    Object.values(textures).forEach((item) => item.dispose());
  }
}

export function runCorridorAssemblyChecks(): void {
  const run = createFloor1DungeonRun("floor1-development-seed");
  const ids = run.map.connections.map((connection) => connection.id);
  check(new Set(ids).size === ids.length, "corridors have unique connection keys");
  check(FLOOR1_STANDARD_CORRIDOR.width === FLOOR1_STANDARD_ROOM.passageWidth, "corridor and passage seam widths match");
  check(FLOOR1_STANDARD_CORRIDOR.height === FLOOR1_STANDARD_ROOM.height, "room and corridor ceilings align");
}
