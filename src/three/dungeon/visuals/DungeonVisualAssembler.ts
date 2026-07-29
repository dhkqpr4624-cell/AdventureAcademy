import * as THREE from "three";
import { worldDirectionBetween } from "../../../game/dungeon/navigation/relativeDirectionResolver";
import type {
  DungeonRoomNode,
  WorldCardinalDirection,
} from "../../../game/dungeon/dungeonTypes";
import type {
  AssembleDungeonVisualsInput,
  DungeonVisualAssembly,
  OpenPassageSocket,
} from "./dungeonVisualTypes";

type Owned = { geometries: THREE.BufferGeometry[]; materials: THREE.Material[] };

function scaleUv(geometry: THREE.BufferGeometry, u: number, v: number) {
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(index, uv.getX(index) * u, uv.getY(index) * v);
  }
  uv.needsUpdate = true;
}

function plane(
  parent: THREE.Group,
  owned: Owned,
  material: THREE.Material,
  size: [number, number],
  position: [number, number, number],
  rotation: [number, number, number],
  repeat: [number, number],
) {
  const geometry = new THREE.PlaneGeometry(...size);
  scaleUv(geometry, Math.max(1, repeat[0]), Math.max(1, repeat[1]));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  owned.geometries.push(geometry);
}

function socketFor(
  room: DungeonRoomNode,
  direction: WorldCardinalDirection,
  width: number,
  height: number,
  roomWidth: number,
  roomDepth: number,
): OpenPassageSocket {
  const positions: Record<WorldCardinalDirection, [number, number, number]> = {
    north: [0, -3 + height / 2, -roomDepth / 2],
    east: [roomWidth / 2, -3 + height / 2, 0],
    south: [0, -3 + height / 2, roomDepth / 2],
    west: [-roomWidth / 2, -3 + height / 2, 0],
  };
  const yaws = { north: 0, east: -Math.PI / 2, south: Math.PI, west: Math.PI / 2 };
  return { roomId: room.id, direction, width, height, localPosition: positions[direction], localYaw: yaws[direction] };
}

function addWall(
  group: THREE.Group,
  owned: Owned,
  material: THREE.Material,
  direction: WorldCardinalDirection,
  open: boolean,
  width: number,
  depth: number,
  height: number,
  passageWidth: number,
  passageHeight: number,
) {
  const horizontal = direction === "north" || direction === "south";
  const span = horizontal ? width : depth;
  const z = direction === "north" ? -depth / 2 : direction === "south" ? depth / 2 : 0;
  const x = direction === "west" ? -width / 2 : direction === "east" ? width / 2 : 0;
  const rotation: [number, number, number] = horizontal ? [0, 0, 0] : [0, Math.PI / 2, 0];
  const addPiece = (pieceWidth: number, center: number, pieceHeight: number, centerY: number) => {
    const position: [number, number, number] = horizontal
      ? [center, centerY, z]
      : [x, centerY, center];
    plane(group, owned, material, [pieceWidth, pieceHeight], position, rotation, [pieceWidth / 4, pieceHeight / 3]);
  };
  if (!open) {
    addPiece(span, 0, height, 0);
    return;
  }
  const sideWidth = (span - passageWidth) / 2;
  addPiece(sideWidth, -(passageWidth + sideWidth) / 2, height, 0);
  addPiece(sideWidth, (passageWidth + sideWidth) / 2, height, 0);
  const lintelHeight = height - passageHeight;
  addPiece(passageWidth, 0, lintelHeight, height / 2 - lintelHeight / 2);
}

function buildRoom(input: AssembleDungeonVisualsInput, room: DungeonRoomNode, open: Set<WorldCardinalDirection>, owned: Owned) {
  const template = input.roomTemplate;
  const group = new THREE.Group();
  group.name = `RoomVisual:${room.id}`;
  group.position.set(room.position.x, room.position.y, room.position.z);
  const materials = {
    wall: new THREE.MeshBasicMaterial({ map: input.textures.wall, side: THREE.FrontSide }),
    floor: new THREE.MeshBasicMaterial({ map: input.textures.floor, side: THREE.FrontSide }),
    ceiling: new THREE.MeshBasicMaterial({ map: input.textures.ceiling, side: THREE.FrontSide }),
  };
  owned.materials.push(...Object.values(materials));
  plane(group, owned, materials.floor, [template.width, template.depth], [0, -template.height / 2, 0], [-Math.PI / 2, 0, 0], [template.width / 5, template.depth / 5]);
  plane(group, owned, materials.ceiling, [template.width, template.depth], [0, template.height / 2, 0], [Math.PI / 2, 0, 0], [template.width / 5, template.depth / 5]);
  (["north", "east", "south", "west"] as const).forEach((direction) =>
    addWall(group, owned, materials.wall, direction, open.has(direction), template.width, template.depth, template.height, template.passageWidth, template.passageHeight),
  );
  return group;
}

function addStraightCorridor(
  group: THREE.Group,
  owned: Owned,
  materials: { wall: THREE.Material; floor: THREE.Material; ceiling: THREE.Material },
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  height: number,
) {
  const delta = end.clone().sub(start);
  const length = Math.hypot(delta.x, delta.z);
  if (length <= 0.001) return;
  const horizontal = Math.abs(delta.x) > Math.abs(delta.z);
  const center = start.clone().add(end).multiplyScalar(0.5);
  const floorSize: [number, number] = horizontal ? [length, width] : [width, length];
  plane(group, owned, materials.floor, floorSize, [center.x, -height / 2, center.z], [-Math.PI / 2, 0, 0], [floorSize[0] / 4, floorSize[1] / 4]);
  plane(group, owned, materials.ceiling, floorSize, [center.x, height / 2, center.z], [Math.PI / 2, 0, 0], [floorSize[0] / 4, floorSize[1] / 4]);
  if (horizontal) {
    for (const offset of [-width / 2, width / 2]) {
      plane(group, owned, materials.wall, [length, height], [center.x, 0, center.z + offset], [0, 0, 0], [length / 4, height / 3]);
    }
  } else {
    for (const offset of [-width / 2, width / 2]) {
      plane(group, owned, materials.wall, [length, height], [center.x + offset, 0, center.z], [0, Math.PI / 2, 0], [length / 4, height / 3]);
    }
  }
}

export function assembleDungeonVisuals(input: AssembleDungeonVisualsInput): DungeonVisualAssembly {
  const root = new THREE.Group();
  root.name = "DungeonVisualAssembly";
  const roomGroups = new Map<string, THREE.Group>();
  const corridorGroups = new Map<string, THREE.Group>();
  const passageSockets: OpenPassageSocket[] = [];
  const owned: Owned = { geometries: [], materials: [] };
  const openings = new Map(input.dungeonMap.rooms.map((room) => [room.id, new Set<WorldCardinalDirection>()]));
  const rooms = new Map(input.dungeonMap.rooms.map((room) => [room.id, room]));

  for (const connection of input.dungeonMap.connections) {
    const source = rooms.get(connection.fromRoomId);
    const target = rooms.get(connection.toRoomId);
    if (!source || !target) throw new Error(`Invalid visual connection ${connection.id}`);
    const direction = worldDirectionBetween(source, target);
    const reverse = ({ north: "south", east: "west", south: "north", west: "east" } as const)[direction];
    openings.get(source.id)?.add(direction);
    openings.get(target.id)?.add(reverse);
  }
  for (const room of input.dungeonMap.rooms) {
    const open = openings.get(room.id) ?? new Set();
    const group = buildRoom(input, room, open, owned);
    roomGroups.set(room.id, group);
    root.add(group);
    for (const direction of open) {
      passageSockets.push(socketFor(room, direction, input.roomTemplate.passageWidth, input.roomTemplate.passageHeight, input.roomTemplate.width, input.roomTemplate.depth));
    }
  }
  const corridorMaterials = {
    wall: new THREE.MeshBasicMaterial({ map: input.textures.wall }),
    floor: new THREE.MeshBasicMaterial({ map: input.textures.floor }),
    ceiling: new THREE.MeshBasicMaterial({ map: input.textures.ceiling }),
  };
  owned.materials.push(...Object.values(corridorMaterials));
  for (const connection of input.dungeonMap.connections) {
    const source = rooms.get(connection.fromRoomId)!;
    const target = rooms.get(connection.toRoomId)!;
    const group = new THREE.Group();
    group.name = `CorridorVisual:${connection.id}`;
    const direction = worldDirectionBetween(source, target);
    const halfRoom = direction === "east" || direction === "west" ? input.roomTemplate.width / 2 : input.roomTemplate.depth / 2;
    const signX = Math.sign(target.position.x - source.position.x);
    const signZ = Math.sign(target.position.z - source.position.z);
    const start = new THREE.Vector3(source.position.x + signX * halfRoom, 0, source.position.z + signZ * halfRoom);
    const end = new THREE.Vector3(target.position.x - signX * halfRoom, 0, target.position.z - signZ * halfRoom);
    if (signX !== 0 && signZ !== 0) {
      const corner = new THREE.Vector3(end.x, 0, start.z);
      addStraightCorridor(group, owned, corridorMaterials, start, corner, input.corridorTemplate.width, input.corridorTemplate.height);
      addStraightCorridor(group, owned, corridorMaterials, corner, end, input.corridorTemplate.width, input.corridorTemplate.height);
    } else {
      addStraightCorridor(group, owned, corridorMaterials, start, end, input.corridorTemplate.width, input.corridorTemplate.height);
    }
    corridorGroups.set(connection.id, group);
    root.add(group);
  }
  return {
    root,
    roomGroups,
    corridorGroups,
    passageSockets,
    dispose() {
      root.removeFromParent();
      owned.geometries.forEach((geometry) => geometry.dispose());
      owned.materials.forEach((material) => material.dispose());
    },
  };
}
