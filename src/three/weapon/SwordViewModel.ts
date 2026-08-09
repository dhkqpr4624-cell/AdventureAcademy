import * as THREE from "three";

export type Vector3Tuple = [number, number, number];

export type WeaponViewportPreset = {
  minAspect: number;
  maxAspect: number;
  positionMultiplier: Vector3Tuple;
  scaleMultiplier: number;
};

export type SwordDefinition = {
  id: string;
  textureUrl: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
  pivot: [number, number];
  alphaTest: number;
  viewportPresets: WeaponViewportPreset[];
};

export type WeaponTransform = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
};

export const BASIC_SWORD_DEFINITION: SwordDefinition = {
  id: "basic-sword",
  textureUrl: `${import.meta.env.BASE_URL}assets/swords/basic-sword.png`,
  position: [1.6, -1.3, -2.15],
  rotation: [-0.24, -0.42, -1.25],
  scale: 2.1,
  pivot: [0.82, 0.82],
  alphaTest: 0.1,
  viewportPresets: [
    {
      minAspect: 0,
      maxAspect: 1.45,
      positionMultiplier: [0.78, 0.88, 1],
      scaleMultiplier: 0.82,
    },
    {
      minAspect: 1.45,
      maxAspect: 1.7,
      positionMultiplier: [0.9, 0.94, 1],
      scaleMultiplier: 0.92,
    },
    {
      minAspect: 1.7,
      maxAspect: Number.POSITIVE_INFINITY,
      positionMultiplier: [1, 1, 1],
      scaleMultiplier: 1,
    },
  ],
};

export const GOJOSEON_BRONZE_SWORD_DEFINITION: SwordDefinition = {
  ...BASIC_SWORD_DEFINITION,
  id: "gojoseon-bronze-sword",
  textureUrl: `${import.meta.env.BASE_URL}assets/swords/bipa-bronze-sword.png`,
};
export const HAND_AXE_DEFINITION: SwordDefinition = {
  ...BASIC_SWORD_DEFINITION,
  id: "hand-axe",
  textureUrl: `${import.meta.env.BASE_URL}assets/items/hand-axe.png`,
};

export function getSwordDefinitionForEquippedItem(
  equippedItemId: string | null | undefined,
): SwordDefinition {
  if (equippedItemId === "weapon-gojoseon-bronze-dagger") return GOJOSEON_BRONZE_SWORD_DEFINITION;
  if (equippedItemId === "weapon-hand-axe") return HAND_AXE_DEFINITION;
  return BASIC_SWORD_DEFINITION;
}

export class SwordViewModel {
  readonly root = new THREE.Group();
  readonly pivot = new THREE.Group();

  private definition: SwordDefinition | null = null;
  private swordPlane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null =
    null;
  private texture: THREE.Texture | null = null;
  private loadRevision = 0;
  private disposed = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.root.name = "WeaponViewModelRoot";
    this.pivot.name = "WeaponPivot";
    this.root.add(this.pivot);
    camera.add(this.root);
  }

  setDefinition(definition: SwordDefinition, aspect: number): void {
    if (this.disposed) {
      return;
    }

    this.definition = definition;
    this.applyResponsiveTransform(aspect);

    const revision = ++this.loadRevision;
    new THREE.TextureLoader().load(
      definition.textureUrl,
      (texture) => {
        if (this.disposed || revision !== this.loadRevision) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;

        this.replaceSwordPlane(texture, definition);
      },
      undefined,
      () => {
        // The empty dungeon remains usable if the optional view-model asset fails.
      },
    );
  }

  updateAspect(aspect: number): void {
    if (this.definition) {
      this.applyResponsiveTransform(aspect);
    }
  }

  captureTransform(): WeaponTransform {
    return {
      position: this.root.position.clone(),
      rotation: this.pivot.rotation.clone(),
      scale: this.pivot.scale.x,
    };
  }

  applyTransform(transform: WeaponTransform): void {
    if (this.disposed) {
      return;
    }

    this.root.position.copy(transform.position);
    this.pivot.rotation.copy(transform.rotation);
    this.pivot.scale.setScalar(transform.scale);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.loadRevision += 1;
    this.clearSwordPlane();
    this.root.removeFromParent();
    this.root.clear();
    this.pivot.clear();
  }

  private applyResponsiveTransform(aspect: number): void {
    const definition = this.definition;

    if (!definition) {
      return;
    }

    const preset =
      definition.viewportPresets.find(
        ({ minAspect, maxAspect }) =>
          aspect >= minAspect && aspect < maxAspect,
      ) ?? definition.viewportPresets.at(-1);
    const positionMultiplier = preset?.positionMultiplier ?? [1, 1, 1];
    const scaleMultiplier = preset?.scaleMultiplier ?? 1;

    this.root.position.set(
      definition.position[0] * positionMultiplier[0],
      definition.position[1] * positionMultiplier[1],
      definition.position[2] * positionMultiplier[2],
    );
    this.pivot.rotation.set(...definition.rotation);
    this.pivot.scale.setScalar(definition.scale * scaleMultiplier);
  }

  private replaceSwordPlane(
    texture: THREE.Texture,
    definition: SwordDefinition,
  ): void {
    this.clearSwordPlane();

    const image = texture.image as { width?: number; height?: number };
    const aspect =
      image.width && image.height ? image.width / image.height : 1;
    const geometry = new THREE.PlaneGeometry(aspect, 1);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: definition.alphaTest,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const swordPlane = new THREE.Mesh(geometry, material);

    swordPlane.name = "SwordPlane";
    swordPlane.position.set(
      (0.5 - definition.pivot[0]) * aspect,
      definition.pivot[1] - 0.5,
      0,
    );
    swordPlane.renderOrder = 10_000;
    swordPlane.frustumCulled = false;

    this.texture = texture;
    this.swordPlane = swordPlane;
    this.pivot.add(swordPlane);
  }

  private clearSwordPlane(): void {
    if (this.swordPlane) {
      this.swordPlane.removeFromParent();
      this.swordPlane.geometry.dispose();
      this.swordPlane.material.dispose();
      this.swordPlane = null;
    }

    this.texture?.dispose();
    this.texture = null;
  }
}
