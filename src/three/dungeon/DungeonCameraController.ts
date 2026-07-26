import * as THREE from "three";
import type {
  DungeonCameraPathPoint,
  DungeonCameraPose,
} from "../../game/dungeon/dungeonTypes";

type MovementOptions = {
  reducedMotion: boolean;
  mode?: "forward" | "backward";
  onComplete: () => void;
};

type PreparedCameraSegment = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  length: number;
  cumulativeStart: number;
  cumulativeEnd: number;
  yaw: number;
};

const CAMERA_SPEED_UNITS_PER_SECOND = 10;
const ARRIVAL_TURN_DURATION_MS = 420;

function easeAtWholePathEnds(progress: number): number {
  const edge = 0.12;
  if (progress < edge) {
    const local = progress / edge;
    // Starts at velocity 0 and joins the linear middle with velocity 1.
    return edge * local * local * (2 - local);
  }
  if (progress > 1 - edge) {
    const remaining = (1 - progress) / edge;
    return 1 - edge * remaining * remaining * (2 - remaining);
  }
  return progress;
}

function shortestAngleDelta(from: number, to: number): number {
  return THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
}

export function getYawFromDirection(
  from: THREE.Vector3,
  to: THREE.Vector3,
): number {
  const direction = to.clone().sub(from);
  if (direction.lengthSq() < Number.EPSILON) {
    return 0;
  }
  // A Three.js camera looks along local -Z. This yaw maps -Z to the
  // movement vector, so left (-X) is +PI/2 and right (+X) is -PI/2.
  return Math.atan2(-direction.x, -direction.z);
}

export function getCameraForwardFromYaw(yaw: number): THREE.Vector3 {
  return new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
}

function yawFromPose(pose: DungeonCameraPose): number {
  if (pose.rotationY !== undefined) {
    return pose.rotationY;
  }
  return getYawFromDirection(
    new THREE.Vector3(...pose.position),
    new THREE.Vector3(...pose.lookAt),
  );
}

export class DungeonCameraController {
  private frameId: number | null = null;
  private sequenceId = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    this.camera.rotation.order = "YXZ";
  }

  setPose(pose: DungeonCameraPose): void {
    this.cancel();
    this.camera.position.set(...pose.position);
    this.camera.rotation.set(0, yawFromPose(pose), 0);
  }

  transitionToPose(
    pose: DungeonCameraPose,
    reducedMotion: boolean,
    onComplete: () => void,
  ): void {
    this.moveAlongPath(
      [{
        kind: "roomCenter",
        position: pose.position,
        lookAt: pose.lookAt,
        rotationY: pose.rotationY,
      }],
      { reducedMotion, onComplete },
    );
  }

  moveAlongPath(
    path: readonly DungeonCameraPathPoint[],
    options: MovementOptions,
  ): void {
    this.cancel();
    const sequenceId = ++this.sequenceId;
    if (path.length === 0) {
      options.onComplete();
      return;
    }

    const positions = [
      this.camera.position.clone(),
      ...path.map((point) => new THREE.Vector3(...point.position)),
    ];
    let cumulative = 0;
    const segments: PreparedCameraSegment[] = [];
    for (let index = 0; index < positions.length - 1; index += 1) {
      const from = positions[index];
      const to = positions[index + 1];
      const length = from.distanceTo(to);
      if (length <= Number.EPSILON) {
        continue;
      }
      segments.push({
        from,
        to,
        length,
        cumulativeStart: cumulative,
        cumulativeEnd: cumulative + length,
        yaw: getYawFromDirection(from, to),
      });
      cumulative += length;
    }
    if (segments.length === 0) {
      options.onComplete();
      return;
    }

    const totalLength = cumulative;
    const duration = options.reducedMotion
      ? 80
      : Math.max(500, (totalLength / CAMERA_SPEED_UNITS_PER_SECOND) * 1000);
    const initialYaw = this.camera.rotation.y;
    const startedAt = performance.now();
    const movementMode = options.mode ?? "forward";

    const finishAtDestination = (now: number) => {
      const finalPoint = path[path.length - 1];
      const finalPosition = new THREE.Vector3(...finalPoint.position);
      const finalYaw = finalPoint.lookAt
        ? getYawFromDirection(
            finalPosition,
            new THREE.Vector3(...finalPoint.lookAt),
          )
        : finalPoint.rotationY ?? segments[segments.length - 1].yaw;
      this.camera.position.copy(finalPosition);

      if (movementMode !== "backward") {
        this.camera.rotation.y = finalYaw;
        this.frameId = null;
        options.onComplete();
        return;
      }

      const turnDuration = options.reducedMotion ? 80 : ARRIVAL_TURN_DURATION_MS;
      const turnStartedAt = now;
      const turnFromYaw = initialYaw;
      const turnDelta = shortestAngleDelta(turnFromYaw, finalYaw);
      const animateArrivalTurn = (turnNow: number) => {
        if (sequenceId !== this.sequenceId) {
          return;
        }
        const turnProgress = THREE.MathUtils.clamp(
          (turnNow - turnStartedAt) / turnDuration,
          0,
          1,
        );
        const easedTurn = THREE.MathUtils.smoothstep(turnProgress, 0, 1);
        this.camera.position.copy(finalPosition);
        this.camera.rotation.y = turnFromYaw + turnDelta * easedTurn;
        if (turnProgress >= 1) {
          this.camera.rotation.y = finalYaw;
          this.frameId = null;
          options.onComplete();
          return;
        }
        this.frameId = requestAnimationFrame(animateArrivalTurn);
      };
      this.frameId = requestAnimationFrame(animateArrivalTurn);
    };

    const animate = (now: number) => {
      if (sequenceId !== this.sequenceId) {
        return;
      }
      const rawProgress = Math.min(1, (now - startedAt) / duration);
      const travelled = easeAtWholePathEnds(rawProgress) * totalLength;
      const segment =
        segments.find((candidate) => travelled <= candidate.cumulativeEnd) ??
        segments[segments.length - 1];
      const localProgress = THREE.MathUtils.clamp(
        (travelled - segment.cumulativeStart) / segment.length,
        0,
        1,
      );
      this.camera.position.lerpVectors(segment.from, segment.to, localProgress);

      if (movementMode === "backward") {
        // Backtracking is intentional FPS-style movement: keep looking into the
        // room being left while the camera follows the reverse position path.
        this.camera.rotation.y = initialYaw;
      } else {
        const segmentIndex = segments.indexOf(segment);
        const previousYaw =
          segmentIndex === 0 ? initialYaw : segments[segmentIndex - 1].yaw;
        const turnProgress = THREE.MathUtils.smoothstep(localProgress, 0, 0.32);
        this.camera.rotation.y =
          previousYaw + shortestAngleDelta(previousYaw, segment.yaw) * turnProgress;
      }

      if (rawProgress >= 1) {
        finishAtDestination(now);
        return;
      }
      this.frameId = requestAnimationFrame(animate);
    };
    this.frameId = requestAnimationFrame(animate);
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
