import * as THREE from "three";
import type { DungeonMapDefinition } from "../../game/dungeon/dungeonTypes";
import { createSeededRandom } from "../../game/dungeon/generation/seededRandom";

type OwnedEnvironment = { root: THREE.Group; fog: THREE.Fog; dispose: () => void };

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon5/${name}`;
const FLOOR_MARGIN = 100;
const SKY_RADIUS = 260;
const COMBAT_PLANE_CHANCE = 0.45;
const COMBAT_ASPECT_RATIO = 1536 / 1024;

function configure(texture: THREE.Texture, repeat = false) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  return texture;
}

function createMountainRidge(
  width: number,
  baseY: number,
  minHeight: number,
  maxHeight: number,
  segments: number,
  random: ReturnType<typeof createSeededRandom>,
) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const ridgeHeights: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const broadWave = Math.sin((index / segments) * Math.PI * 5.5) * 0.18 + 0.52;
    ridgeHeights.push(minHeight + (maxHeight - minHeight) * Math.min(1, broadWave + random.next() * 0.3));
  }
  for (let index = 0; index <= segments; index += 1) {
    const x = -width / 2 + width * (index / segments);
    vertices.push(x, baseY, 0, x, baseY + ridgeHeights[index], 0);
  }
  for (let index = 0; index < segments; index += 1) {
    const lowerLeft = index * 2;
    const upperLeft = lowerLeft + 1;
    const lowerRight = lowerLeft + 2;
    const upperRight = lowerLeft + 3;
    if (index % 2 === 0) indices.push(lowerLeft, lowerRight, upperLeft, upperLeft, lowerRight, upperRight);
    else indices.push(lowerLeft, lowerRight, upperRight, lowerLeft, upperRight, upperLeft);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createDungeon5Environment(map: DungeonMapDefinition, seed: string): OwnedEnvironment {
  const root = new THREE.Group();
  root.name = "Dungeon5BackgroundEnvironment";
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();
  const xs = map.rooms.map((room) => room.position.x);
  const zs = map.rooms.map((room) => room.position.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const floorWidth = Math.max(150, maxX - minX + FLOOR_MARGIN);
  const floorDepth = maxZ - minZ + FLOOR_MARGIN;
  const floorTexture = configure(loader.load(asset("floor.png")), true);
  floorTexture.repeat.set(24, 24);
  textures.push(floorTexture);
  const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
  const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.FrontSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.name = "Dungeon5FloorPlane";
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, -3, centerZ);
  root.add(floor);
  geometries.push(floorGeometry);
  materials.push(floorMaterial);

  const skyTexture = configure(loader.load(asset("sky-sphere.png")));
  textures.push(skyTexture);
  const skyGeometry = new THREE.SphereGeometry(SKY_RADIUS, 48, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture, side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.name = "Dungeon5SkySphere";
  sky.position.set(centerX, 12, centerZ);
  sky.renderOrder = -30;
  root.add(sky);
  geometries.push(skyGeometry);
  materials.push(skyMaterial);

  const mountainRandom = createSeededRandom(`${seed}::dungeon5-mountains`);
  const mountainWidth = Math.max(260, floorWidth + 120);
  const floorFarEdge = centerZ - floorDepth / 2;
  const ridgeSettings = [
    { z: floorFarEdge - 16, y: -3.2, min: 15, max: 27, color: 0x829bad },
    { z: floorFarEdge - 25, y: -2.6, min: 20, max: 34, color: 0x6f8798 },
    { z: floorFarEdge - 36, y: -2.0, min: 24, max: 40, color: 0x607888 },
  ];
  ridgeSettings.forEach((settings, index) => {
    const geometry = createMountainRidge(
      mountainWidth + index * 30, settings.y, settings.min, settings.max, 42, mountainRandom,
    );
    const material = new THREE.MeshBasicMaterial({
      color: settings.color, side: THREE.DoubleSide, depthWrite: true, fog: true,
    });
    const ridge = new THREE.Mesh(geometry, material);
    ridge.name = `Dungeon5LowPolyMountainRidge-${index + 1}`;
    ridge.position.set(centerX, 0, settings.z);
    ridge.renderOrder = -10 + index;
    root.add(ridge);
    geometries.push(geometry);
    materials.push(material);
  });

  const random = createSeededRandom(`${seed}::dungeon5-background-combat`);
  const combatTextures = [1, 2, 3].map((index) => configure(loader.load(asset(`background-combat-${index}.png`))));
  textures.push(...combatTextures);
  map.rooms.forEach((room, roomIndex) => {
    for (const side of [-1, 1] as const) {
      if (random.next() > COMBAT_PLANE_CHANCE) continue;
      const texture = combatTextures[Math.floor(random.next() * combatTextures.length)];
      const height = 7.5 + random.next() * 2;
      const geometry = new THREE.PlaneGeometry(height * COMBAT_ASPECT_RATIO, height);
      const material = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, alphaTest: 0.04, depthWrite: false, side: THREE.DoubleSide, fog: true,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.name = `Dungeon5CombatScenery-${roomIndex}-${side}`;
      plane.position.set(
        room.position.x + side * (15 + random.next() * 6),
        -3 + height / 2 - 0.22,
        room.position.z - 1 + (random.next() - 0.5) * 7,
      );
      plane.renderOrder = 2;
      root.add(plane);
      geometries.push(geometry);
      materials.push(material);
    }
  });

  return {
    root,
    fog: new THREE.Fog(0x9fc7d4, 60, 240),
    dispose: () => {
      root.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
