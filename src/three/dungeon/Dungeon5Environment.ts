import * as THREE from "three";
import type { DungeonMapDefinition } from "../../game/dungeon/dungeonTypes";
import { createSeededRandom } from "../../game/dungeon/generation/seededRandom";

type OwnedEnvironment = {
  root: THREE.Group;
  dispose: () => void;
};

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon5/${name}`;

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

export function createDungeon5Environment(
  map: DungeonMapDefinition,
  seed: string,
): OwnedEnvironment {
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

  const floorTexture = configure(loader.load(asset("floor.png")), true);
  floorTexture.repeat.set(24, 24);
  textures.push(floorTexture);
  const floorGeometry = new THREE.PlaneGeometry(maxX - minX + 150, maxZ - minZ + 150);
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
  const skyGeometry = new THREE.SphereGeometry(92, 48, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide, depthWrite: false });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.name = "Dungeon5SkySphere";
  sky.position.set(centerX, 12, centerZ);
  sky.renderOrder = -20;
  root.add(sky);
  geometries.push(skyGeometry);
  materials.push(skyMaterial);

  const mountainTexture = configure(loader.load(asset("background-mountain.png")));
  textures.push(mountainTexture);
  const mountainGeometry = new THREE.PlaneGeometry(145, 42);
  const mountainMaterial = new THREE.MeshBasicMaterial({ map: mountainTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.MultiplyBlending });
  const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
  mountain.name = "Dungeon5DistantMountain";
  mountain.position.set(centerX, 15, minZ - 58);
  root.add(mountain);
  geometries.push(mountainGeometry);
  materials.push(mountainMaterial);

  const random = createSeededRandom(`${seed}::dungeon5-background-combat`);
  const combatTextures = [1, 2, 3].map((index) => configure(loader.load(asset(`background-combat-${index}.png`))));
  textures.push(...combatTextures);
  map.rooms.forEach((room, roomIndex) => {
    for (const side of [-1, 1] as const) {
      const texture = combatTextures[Math.floor(random.next() * combatTextures.length)];
      const geometry = new THREE.PlaneGeometry(8 + random.next() * 4, 7 + random.next() * 3);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.04, depthWrite: false, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(geometry, material);
      plane.name = `Dungeon5CombatScenery-${roomIndex}-${side}`;
      plane.position.set(room.position.x + side * (8.5 + random.next() * 4), 1, room.position.z - 1 + (random.next() - 0.5) * 6);
      plane.renderOrder = 2;
      root.add(plane);
      geometries.push(geometry);
      materials.push(material);
    }
  });

  return {
    root,
    dispose: () => {
      root.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
