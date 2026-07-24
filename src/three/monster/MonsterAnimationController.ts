import * as THREE from "three";

type MonsterAnimation =
  | "hit"
  | "criticalHit"
  | "miss"
  | "attack"
  | "stagger"
  | "defeat"
  | "escape";

type ActiveAnimation = {
  type: MonsterAnimation;
  elapsed: number;
  duration: number;
  onImpact?: () => void;
  impacted: boolean;
  resolve: () => void;
};

const DURATIONS: Record<MonsterAnimation, number> = {
  hit: 0.34,
  criticalHit: 0.48,
  miss: 0.34,
  attack: 0.62,
  stagger: 0.42,
  defeat: 0.7,
  escape: 0.75,
};

export class MonsterAnimationController {
  private active: ActiveAnimation | null = null;
  private disposed = false;
  private readonly basePosition: THREE.Vector3;

  constructor(
    private readonly mesh: THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.MeshBasicMaterial
    >,
  ) {
    this.basePosition = mesh.position.clone();
  }

  get isPlaying(): boolean {
    return this.active !== null;
  }

  play(type: MonsterAnimation, onImpact?: () => void): Promise<void> {
    if (this.disposed || this.active) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.active = {
        type,
        elapsed: 0,
        duration: DURATIONS[type],
        onImpact,
        impacted: false,
        resolve,
      };
    });
  }

  update(deltaTime: number): void {
    const active = this.active;
    if (!active || this.disposed) {
      return;
    }

    active.elapsed += Math.max(0, deltaTime);
    const t = THREE.MathUtils.clamp(active.elapsed / active.duration, 0, 1);
    this.apply(active.type, t);

    if (active.type === "attack" && !active.impacted && t >= 0.46) {
      active.impacted = true;
      active.onImpact?.();
    }

    if (t >= 1) {
      const keepHidden =
        active.type === "defeat" || active.type === "escape";
      if (!keepHidden) {
        this.restore();
      }
      this.active = null;
      active.resolve();
    }
  }

  reset(): void {
    this.active?.resolve();
    this.active = null;
    this.mesh.visible = true;
    this.mesh.material.opacity = 1;
    this.mesh.material.color.set(0xffffff);
    this.restore();
  }

  dispose(): void {
    this.disposed = true;
    this.active?.resolve();
    this.active = null;
  }

  private apply(type: MonsterAnimation, t: number): void {
    const pulse = Math.sin(t * Math.PI);
    this.mesh.position.copy(this.basePosition);
    this.mesh.material.color.set(0xffffff);

    switch (type) {
      case "hit":
        this.mesh.position.x += Math.sin(t * Math.PI * 8) * 0.16 * (1 - t);
        this.mesh.material.color.setRGB(1, 1, 1 - pulse * 0.65);
        break;
      case "criticalHit":
        this.mesh.position.x += Math.sin(t * Math.PI * 10) * 0.25 * (1 - t);
        this.mesh.position.y += pulse * 0.07;
        this.mesh.rotation.z = Math.sin(t * Math.PI * 4) * 0.1 * (1 - t);
        this.mesh.material.color.setRGB(1, 1 - pulse * 0.12, 1 - pulse * 0.58);
        break;
      case "miss":
        this.mesh.position.x += pulse * 0.28;
        break;
      case "attack":
        this.mesh.position.z += pulse * 1.15;
        this.mesh.position.y += pulse * 0.08;
        break;
      case "stagger":
        this.mesh.position.x += Math.sin(t * Math.PI * 5) * 0.11;
        this.mesh.rotation.z = Math.sin(t * Math.PI * 2) * 0.08;
        break;
      case "defeat":
        this.mesh.position.y -= t * 1.15;
        this.mesh.position.x += Math.sin(t * Math.PI * 7) * 0.08 * (1 - t);
        this.mesh.material.opacity = 1 - t;
        break;
      case "escape":
        this.mesh.position.x += t * 4.5;
        this.mesh.position.z -= t * 2;
        this.mesh.material.opacity = 1 - t;
        break;
    }
  }

  private restore(): void {
    this.mesh.position.copy(this.basePosition);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.material.opacity = 1;
  }
}
