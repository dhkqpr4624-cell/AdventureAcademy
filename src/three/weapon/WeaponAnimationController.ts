import * as THREE from "three";
import {
  SwordViewModel,
  type WeaponTransform,
} from "./SwordViewModel";

export type WeaponAnimationState =
  | "idle"
  | "windup"
  | "swing"
  | "hit"
  | "miss"
  | "finish"
  | "returnToIdle";

export type WeaponAttackType = "hit" | "miss" | "finish";

export type WeaponAnimationCallbacks = {
  onHit?: () => void;
  onMiss?: () => void;
  onStateChange?: (state: WeaponAnimationState) => void;
  onComplete?: () => void;
};

type AnimationPose = {
  positionOffset: THREE.Vector3;
  rotationOffset: THREE.Vector3;
};

type AnimationStep = {
  state: Exclude<WeaponAnimationState, "idle">;
  duration: number;
  target: AnimationPose;
  easing: (t: number) => number;
  cameraShake: number;
  callback?: "hit" | "miss";
};

const ZERO_POSE: AnimationPose = {
  positionOffset: new THREE.Vector3(),
  rotationOffset: new THREE.Vector3(),
};

const NORMAL_WINDUP: AnimationPose = {
  positionOffset: new THREE.Vector3(0.08, -0.015, 0.03),
  rotationOffset: new THREE.Vector3(-0.08, 0.1, -0.2),
};

const NORMAL_SWING: AnimationPose = {
  positionOffset: new THREE.Vector3(-0.34, -0.22, 0.02),
  rotationOffset: new THREE.Vector3(0.2, -0.1, 2.35),
};

const MISS_FOLLOW_THROUGH: AnimationPose = {
  positionOffset: new THREE.Vector3(-0.43, -0.3, 0.03),
  rotationOffset: new THREE.Vector3(0.25, -0.14, 2.55),
};

const FINISH_WINDUP: AnimationPose = {
  positionOffset: new THREE.Vector3(0.13, 0.015, 0.05),
  rotationOffset: new THREE.Vector3(-0.13, 0.16, -0.32),
};

const FINISH_SWING: AnimationPose = {
  positionOffset: new THREE.Vector3(-0.48, -0.31, 0.01),
  rotationOffset: new THREE.Vector3(0.3, -0.16, 2.65),
};

const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1);
const easeInCubic = (t: number) => t * t * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function clonePose(pose: AnimationPose): AnimationPose {
  return {
    positionOffset: pose.positionOffset.clone(),
    rotationOffset: pose.rotationOffset.clone(),
  };
}

export class WeaponAnimationController {
  private state: WeaponAnimationState = "idle";
  private steps: AnimationStep[] = [];
  private stepIndex = 0;
  private stepElapsed = 0;
  private idleTransform: WeaponTransform | null = null;
  private stepStartPose = clonePose(ZERO_POSE);
  private currentPose = clonePose(ZERO_POSE);
  private callbacks: WeaponAnimationCallbacks = {};
  private readonly cameraIdlePosition: THREE.Vector3;
  private disposed = false;

  constructor(
    private readonly viewModel: SwordViewModel,
    private readonly camera: THREE.PerspectiveCamera,
  ) {
    this.cameraIdlePosition = camera.position.clone();
  }

  get isPlaying(): boolean {
    return this.state !== "idle";
  }

  play(
    attackType: WeaponAttackType,
    callbacks: WeaponAnimationCallbacks = {},
  ): boolean {
    if (this.disposed || this.isPlaying) {
      return false;
    }

    this.idleTransform = this.viewModel.captureTransform();
    this.callbacks = callbacks;
    this.steps = this.createSteps(attackType);
    this.stepIndex = 0;
    this.stepElapsed = 0;
    this.currentPose = clonePose(ZERO_POSE);
    this.stepStartPose = clonePose(ZERO_POSE);
    this.enterStep(this.steps[0]);
    return true;
  }

  update(deltaTime: number): void {
    if (this.disposed || !this.isPlaying || !this.idleTransform) {
      return;
    }

    let remainingDelta = Math.max(deltaTime, 0);

    while (remainingDelta > 0 && this.isPlaying) {
      const step = this.steps[this.stepIndex];
      if (!step) {
        this.complete();
        return;
      }

      const timeLeftInStep = step.duration - this.stepElapsed;
      const consumedDelta = Math.min(remainingDelta, timeLeftInStep);
      this.stepElapsed += consumedDelta;
      remainingDelta -= consumedDelta;

      const progress = clamp01(this.stepElapsed / step.duration);
      const easedProgress = step.easing(progress);
      this.currentPose.positionOffset.lerpVectors(
        this.stepStartPose.positionOffset,
        step.target.positionOffset,
        easedProgress,
      );
      this.currentPose.rotationOffset.lerpVectors(
        this.stepStartPose.rotationOffset,
        step.target.rotationOffset,
        easedProgress,
      );
      this.applyCurrentPose();
      this.applyCameraShake(step.cameraShake, progress);

      if (progress >= 1) {
        this.finishStep(step);
      }
    }
  }

  cancel(): void {
    if (this.disposed || !this.isPlaying) {
      return;
    }

    this.restoreIdle();
    const onComplete = this.callbacks.onComplete;
    this.reset();
    onComplete?.();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    if (this.isPlaying) {
      this.restoreIdle();
    }
    this.reset();
    this.disposed = true;
  }

  private createSteps(attackType: WeaponAttackType): AnimationStep[] {
    if (attackType === "finish") {
      return [
        {
          state: "windup",
          duration: 0.14,
          target: FINISH_WINDUP,
          easing: easeInOutCubic,
          cameraShake: 0,
        },
        {
          state: "finish",
          duration: 0.17,
          target: FINISH_SWING,
          easing: easeInCubic,
          cameraShake: 0,
        },
        {
          state: "hit",
          duration: 0.08,
          target: FINISH_SWING,
          easing: easeOutCubic,
          cameraShake: 0.022,
          callback: "hit",
        },
        {
          state: "returnToIdle",
          duration: 0.26,
          target: ZERO_POSE,
          easing: easeInOutCubic,
          cameraShake: 0,
        },
      ];
    }

    const isMiss = attackType === "miss";
    return [
      {
        state: "windup",
        duration: 0.13,
        target: NORMAL_WINDUP,
        easing: easeInOutCubic,
        cameraShake: 0,
      },
      {
        state: "swing",
        duration: 0.2,
        target: NORMAL_SWING,
        easing: easeInCubic,
        cameraShake: 0,
      },
      {
        state: isMiss ? "miss" : "hit",
        duration: isMiss ? 0.1 : 0.07,
        target: isMiss ? MISS_FOLLOW_THROUGH : NORMAL_SWING,
        easing: easeOutCubic,
        cameraShake: isMiss ? 0.002 : 0.012,
        callback: isMiss ? "miss" : "hit",
      },
      {
        state: "returnToIdle",
        duration: 0.24,
        target: ZERO_POSE,
        easing: easeInOutCubic,
        cameraShake: 0,
      },
    ];
  }

  private enterStep(step: AnimationStep | undefined): void {
    if (!step) {
      this.complete();
      return;
    }

    this.state = step.state;
    this.stepElapsed = 0;
    this.stepStartPose = clonePose(this.currentPose);
    this.callbacks.onStateChange?.(this.state);

    if (step.callback === "hit") {
      this.callbacks.onHit?.();
    } else if (step.callback === "miss") {
      this.callbacks.onMiss?.();
    }
  }

  private finishStep(step: AnimationStep): void {
    this.currentPose = clonePose(step.target);
    this.stepIndex += 1;
    this.enterStep(this.steps[this.stepIndex]);
  }

  private applyCurrentPose(): void {
    const idle = this.idleTransform;
    if (!idle) {
      return;
    }

    this.viewModel.applyTransform({
      position: idle.position.clone().add(this.currentPose.positionOffset),
      rotation: new THREE.Euler(
        idle.rotation.x + this.currentPose.rotationOffset.x,
        idle.rotation.y + this.currentPose.rotationOffset.y,
        idle.rotation.z + this.currentPose.rotationOffset.z,
        idle.rotation.order,
      ),
      scale: idle.scale,
    });
  }

  private applyCameraShake(amplitude: number, progress: number): void {
    if (amplitude <= 0) {
      this.camera.position.copy(this.cameraIdlePosition);
      return;
    }

    const envelope = Math.sin(progress * Math.PI);
    this.camera.position.set(
      this.cameraIdlePosition.x +
        Math.sin(progress * Math.PI * 8) * amplitude * envelope,
      this.cameraIdlePosition.y +
        Math.cos(progress * Math.PI * 10) * amplitude * envelope,
      this.cameraIdlePosition.z,
    );
  }

  private restoreIdle(): void {
    if (this.idleTransform) {
      this.viewModel.applyTransform(this.idleTransform);
    }
    this.camera.position.copy(this.cameraIdlePosition);
  }

  private complete(): void {
    this.restoreIdle();
    const onComplete = this.callbacks.onComplete;
    this.reset();
    onComplete?.();
  }

  private reset(): void {
    this.state = "idle";
    this.steps = [];
    this.stepIndex = 0;
    this.stepElapsed = 0;
    this.idleTransform = null;
    this.currentPose = clonePose(ZERO_POSE);
    this.stepStartPose = clonePose(ZERO_POSE);
    this.callbacks = {};
  }
}
