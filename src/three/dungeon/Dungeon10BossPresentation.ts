import * as THREE from "three";
import { DungeonCameraController } from "./DungeonCameraController";

const wait = (durationMs: number) => new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));

export class Dungeon10BossPresentation {
  private readonly root = new THREE.Group();
  private readonly geometry = new THREE.PlaneGeometry(17.1, 18);
  private readonly material = new THREE.MeshBasicMaterial({
    transparent: true,
    alphaTest: 0.04,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  private readonly plane = new THREE.Mesh(this.geometry, this.material);
  private texture: THREE.Texture | null = null;
  private frameId: number | null = null;
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly cameraController: DungeonCameraController,
  ) {
    this.root.name = "Dungeon10BossPlane";
    this.root.position.set(0, 0, -57);
    this.root.visible = false;
    this.plane.renderOrder = 80;
    this.root.add(this.plane);
    scene.add(this.root);
  }

  private rotateYaw(yaw: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.cameraController.moveAlongSteps([{ type: "rotate", yaw, duration }], {
        reducedMotion: false,
        onComplete: resolve,
      });
    });
  }

  private tiltToBossFace(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      const fromPitch = this.camera.rotation.x;
      const target = new THREE.Vector3(0, 5.2, -57);
      const direction = target.sub(this.camera.position).normalize();
      const targetPitch = Math.asin(direction.y);
      const animate = (now: number) => {
        if (this.disposed) return;
        const progress = THREE.MathUtils.clamp((now - startedAt) / duration, 0, 1);
        const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
        this.camera.rotation.x = fromPitch + (targetPitch - fromPitch) * eased;
        if (progress >= 1) {
          this.frameId = null;
          resolve();
          return;
        }
        this.frameId = requestAnimationFrame(animate);
      };
      this.frameId = requestAnimationFrame(animate);
    });
  }

  private loadBoss(imageUrl: string): Promise<void> {
    return new Promise((resolve) => {
      new THREE.TextureLoader().load(imageUrl, (texture) => {
        if (this.disposed) {
          texture.dispose();
          resolve();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        this.texture = texture;
        this.material.map = texture;
        this.material.needsUpdate = true;
        resolve();
      }, undefined, () => resolve());
    });
  }

  async play(imageUrl: string, onRoar: () => Promise<void>): Promise<void> {
    this.cameraController.cancel();
    this.camera.rotation.order = "YXZ";
    const loaded = this.loadBoss(imageUrl);
    await this.rotateYaw(THREE.MathUtils.degToRad(100), 900);
    await this.rotateYaw(0, 900);
    await this.rotateYaw(THREE.MathUtils.degToRad(-100), 900);
    await loaded;
    this.root.visible = true;
    await this.rotateYaw(0, 900);
    await wait(1000);
    await this.tiltToBossFace(1500);
    await onRoar();
  }

  dispose(): void {
    this.disposed = true;
    this.cameraController.cancel();
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.root.removeFromParent();
    this.texture?.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
