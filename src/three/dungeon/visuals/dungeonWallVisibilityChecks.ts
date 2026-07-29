import * as THREE from "three";
import { createFloor1DungeonRun } from "../../../game/dungeon/generation/floor1DungeonRuntime";
import { assembleDungeonVisuals } from "./DungeonVisualAssembler";
import { FLOOR1_STANDARD_CORRIDOR } from "./corridorTemplates";
import { FLOOR1_STANDARD_ROOM } from "./roomVisualTemplates";

function check(value: boolean, message: string) {
  if (!value) throw new Error(`[dungeon wall visibility check] ${message}`);
}
function texture() {
  return new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
}

export function runDungeonWallVisibilityChecks(): void {
  const run = createFloor1DungeonRun("floor1-development-seed");
  const textures = { wall: texture(), floor: texture(), ceiling: texture() };
  const assembly = assembleDungeonVisuals({
    dungeonMap: run.map,
    roomTemplate: FLOOR1_STANDARD_ROOM,
    corridorTemplate: FLOOR1_STANDARD_CORRIDOR,
    textures,
  });
  for (const [id, group] of assembly.roomGroups) {
    const roles = group.userData.wallRoles as Record<string, string>;
    check(["north", "east", "south", "west"].every((key) => roles[key]), `${id}: four wall roles`);
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.MeshBasicMaterial;
      check(material.side === THREE.FrontSide, `${id}: corrected front faces do not require DoubleSide`);
      check(object.scale.x >= 0 && object.scale.y >= 0 && object.scale.z >= 0, `${id}: no negative winding scale`);
    });
  }
  for (const [id, group] of assembly.corridorGroups) {
    const roles = group.userData.surfaceRoles as Record<string, number>;
    check(roles.floor > 0 && roles.ceiling > 0, `${id}: floor and ceiling`);
    check(roles.leftWall > 0 && roles.rightWall > 0, `${id}: both corridor walls`);
  }
  assembly.dispose();
  Object.values(textures).forEach((item) => item.dispose());
}
