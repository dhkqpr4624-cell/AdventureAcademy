import * as THREE from "three";
import type { DungeonCameraPathPoint } from "../../game/dungeon/dungeonTypes";

type MovementOptions = {
  reducedMotion: boolean;
  onComplete: () => void;
};

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function shortestAngleDelta(from: number, to: number): number {
  return THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
}

export class DungeonCameraController {
  private frameId: number | null = null;
  private sequenceId = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    this.camera.rotation.order = "YXZ";
  }

  setPose(position: readonly number[], rotationY: number): void {
    this.cancel();
    this.camera.position.set(position[0], position[1], position[2]);
    this.camera.rotation.set(0, rotationY, 0);
  }

  moveAlongPath(
    path: readonly DungeonCameraPathPoint[],
    options: MovementOptions,
  ): void {
    this.cancel();
    const sequenceId = ++this.sequenceId;
    const points = options.reducedMotion ? path.slice(-1) : path;
    let pointIndex = 0;

    const moveToNextPoint = () => {
      if (sequenceId !== this.sequenceId) {
        return;
      }
      const point = points[pointIndex];
      if (!point) {
        this.frameId = null;
        options.onComplete();
        return;
      }

      const startPosition = this.camera.position.clone();
      const targetPosition = new THREE.Vector3(...point.position);
      const startRotationY = this.camera.rotation.y;
      const targetRotationY = point.rotationY ?? startRotationY;
      const rotationDelta = shortestAngleDelta(startRotationY, targetRotationY);
      const duration = options.reducedMotion
        ? 40
        : Math.max(80, point.duration ?? 360);
      const startedAt = performance.now();

      const animate = (now: number) => {
        if (sequenceId !== this.sequenceId) {
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = easeInOutCubic(progress);
        this.camera.position.lerpVectors(startPosition, targetPosition, eased);
        this.camera.rotation.y = startRotationY + rotationDelta * eased;
        if (progress >= 1) {
          this.camera.position.copy(targetPosition);
          this.camera.rotation.y = targetRotationY;
          pointIndex += 1;
          moveToNextPoint();
          return;
        }
        this.frameId = requestAnimationFrame(animate);
      };
      this.frameId = requestAnimationFrame(animate);
    };

    moveToNextPoint();
  }

  cancel(): void {
    this.sequenceId += 1;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  dispose(): void {
    this.cancel();
  }
}
