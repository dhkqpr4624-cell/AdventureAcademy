import * as THREE from "three";
import {
  SwordViewModel,
  type WeaponTransform,
} from "./SwordViewModel";

export type WeaponAnimationState =
  | "idle"
  | "windup"
  | "swing"
  | "settle"
  | "returnToIdle";

export type WeaponAttackType = "hit" | "miss" | "finish";

export type WeaponAnimationCallbacks = {
  onHit?: () => void;
  onMiss?: () => void;
  onFinish?: () => void;
  onStateChange?: (state: WeaponAnimationState) => void;
  onComplete?: () => void;
};

type AnimationPose = {
  positionOffset: THREE.Vector3;
  rotationOffset: THREE.Vector3;
  scaleMultiplier: number;
};

type AnimationStep = {
  state: Exclude<WeaponAnimationState, "idle">;
  duration: number;
  target: AnimationPose;
  easing: (t: number) => number;
};

const ZERO_POSE: AnimationPose = {
  positionOffset: new THREE.Vector3(),
  rotationOffset: new THREE.Vector3(),
  scaleMultiplier: 1,
};

const ATTACK_WINDUP: AnimationPose = {
  positionOffset: new THREE.Vector3(0.06, 0.015, -0.06),
  rotationOffset: new THREE.Vector3(-0.07, 0.12, -0.105),
  scaleMultiplier: 0.99,
};

const ATTACK_SWING: AnimationPose = {
  positionOffset: new THREE.Vector3(-0.16, -0.11, 0.08),
  rotationOffset: new THREE.Vector3(0.14, -0.16, 0.59),
  scaleMultiplier: 1.045,
};

const ATTACK_SETTLE: AnimationPose = {
  positionOffset: new THREE.Vector3(-0.15, -0.12, 0.07),
  rotationOffset: new THREE.Vector3(0.13, -0.14, 0.56),
  scaleMultiplier: 1.035,
};

const RETURN_ARC: AnimationPose = {
  positionOffset: new THREE.Vector3(0.03, -0.02, -0.04),
  rotationOffset: new THREE.Vector3(-0.04, 0.08, 0.08),
  scaleMultiplier: 1.01,
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
    scaleMultiplier: pose.scaleMultiplier,
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
  private attackType: WeaponAttackType | null = null;
  private disposed = false;

  constructor(
    private readonly viewModel: SwordViewModel,
    _camera: THREE.PerspectiveCamera,
  ) {}

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
    this.attackType = attackType;
    this.steps = this.createSteps();
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
      this.currentPose.scaleMultiplier = THREE.MathUtils.lerp(
        this.stepStartPose.scaleMultiplier,
        step.target.scaleMultiplier,
        easedProgress,
      );
      this.applyCurrentPose();

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

  private createSteps(): AnimationStep[] {
    return [
      {
        state: "windup",
        duration: 0.1,
        target: ATTACK_WINDUP,
        easing: easeInOutCubic,
      },
      {
        state: "swing",
        duration: 0.13,
        target: ATTACK_SWING,
        easing: easeInCubic,
      },
      {
        state: "settle",
        duration: 0.045,
        target: ATTACK_SETTLE,
        easing: easeOutCubic,
      },
      {
        state: "returnToIdle",
        duration: 0.075,
        target: RETURN_ARC,
        easing: easeInOutCubic,
      },
      {
        state: "returnToIdle",
        duration: 0.115,
        target: ZERO_POSE,
        easing: easeInOutCubic,
      },
    ];
  }

  private enterStep(step: AnimationStep | undefined): void {
    if (!step) {
      this.complete();
      return;
    }

    this.stepElapsed = 0;
    this.stepStartPose = clonePose(this.currentPose);
    if (this.state !== step.state) {
      this.state = step.state;
      this.callbacks.onStateChange?.(this.state);
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
      scale: idle.scale * this.currentPose.scaleMultiplier,
    });
  }

  private restoreIdle(): void {
    if (this.idleTransform) {
      this.viewModel.applyTransform(this.idleTransform);
    }
  }

  private complete(): void {
    this.restoreIdle();
    const attackType = this.attackType;
    const { onHit, onMiss, onFinish } = this.callbacks;
    const onComplete = this.callbacks.onComplete;
    this.reset();

    if (attackType === "hit") {
      onHit?.();
    } else if (attackType === "miss") {
      onMiss?.();
    } else if (attackType === "finish") {
      onFinish?.();
    }
    onComplete?.();
  }

  private reset(): void {
    this.state = "idle";
    this.steps = [];
    this.stepIndex = 0;
    this.stepElapsed = 0;
    this.idleTransform = null;
    this.attackType = null;
    this.currentPose = clonePose(ZERO_POSE);
    this.stepStartPose = clonePose(ZERO_POSE);
    this.callbacks = {};
  }
}
