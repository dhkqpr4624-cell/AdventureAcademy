import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  BaseCampFocusPoint,
  BaseCampInteractionRegion,
  BaseCampMapDefinition,
  BaseCampMode,
} from "../../types/baseCamp";
import { BaseCampWorld } from "./BaseCampWorld";

type CameraState = {
  focusX: number;
  focusY: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type BaseCampCameraSnapshot = CameraState & {
  focusPointId?: string;
};

export type BaseCampViewportController = {
  focus: (
    focusPointId: string,
    durationMs: number,
    signal?: AbortSignal,
  ) => Promise<void>;
  restore: (durationMs: number, signal?: AbortSignal) => Promise<void>;
  getCameraSnapshot: () => BaseCampCameraSnapshot;
};

type ViewportSize = {
  width: number;
  height: number;
};

type BaseCampViewportProps = {
  map: BaseCampMapDefinition;
  mode: BaseCampMode;
  focusPointId?: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  selectedRegionId: string | null;
  onSelectRegion: (region: BaseCampInteractionRegion) => void;
  highlightTargetId?: string | null;
  onReady?: () => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.25;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function cameraFromFocusPoint(
  focusPoint: BaseCampFocusPoint,
  zoom?: number,
  offsetX?: number,
  offsetY?: number,
): CameraState {
  return {
    focusX: focusPoint.x,
    focusY: focusPoint.y,
    zoom: clamp(zoom ?? focusPoint.zoom, MIN_ZOOM, MAX_ZOOM),
    offsetX: offsetX ?? focusPoint.offsetX ?? 0,
    offsetY: offsetY ?? focusPoint.offsetY ?? 0,
  };
}

function getClampedCameraCenter(
  camera: CameraState,
  viewport: ViewportSize,
  map: BaseCampMapDefinition,
) {
  const baseScale =
    viewport.width > 0 && viewport.height > 0
      ? Math.max(
          viewport.width / map.worldWidth,
          viewport.height / map.worldHeight,
        )
      : 1;
  const renderedScale = baseScale * camera.zoom;
  const halfWidth = viewport.width / renderedScale / 2;
  const halfHeight = viewport.height / renderedScale / 2;
  const minimumX = halfWidth;
  const maximumX = map.worldWidth - halfWidth;
  const minimumY = halfHeight;
  const maximumY = map.worldHeight - halfHeight;

  return {
    x:
      minimumX > maximumX
        ? map.worldWidth / 2
        : clamp(camera.focusX + camera.offsetX, minimumX, maximumX),
    y:
      minimumY > maximumY
        ? map.worldHeight / 2
        : clamp(camera.focusY + camera.offsetY, minimumY, maximumY),
  };
}

export const BaseCampViewport = forwardRef<BaseCampViewportController, BaseCampViewportProps>(function BaseCampViewport({
  map,
  mode,
  focusPointId = "campCenter",
  zoom,
  offsetX,
  offsetY,
  selectedRegionId,
  onSelectRegion,
  highlightTargetId = null,
  onReady,
}, forwardedRef) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const defaultFocus = map.focusPoints.campCenter;
  const requestedFocus = map.focusPoints[focusPointId] ?? defaultFocus;
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [playCamera, setPlayCamera] = useState<CameraState>(() =>
    cameraFromFocusPoint(defaultFocus),
  );
  const [storyCamera, setStoryCamera] = useState<CameraState>(() =>
    cameraFromFocusPoint(requestedFocus, zoom, offsetX, offsetY),
  );
  const storyCameraRef = useRef(storyCamera);
  const restoreCameraRef = useRef<BaseCampCameraSnapshot>({
    ...cameraFromFocusPoint(defaultFocus),
    focusPointId: "campCenter",
  });

  const setStoryCameraState = useCallback((camera: CameraState) => {
    storyCameraRef.current = camera;
    setStoryCamera(camera);
  }, []);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const bounds = element.getBoundingClientRect();
      setViewport({ width: bounds.width, height: bounds.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (viewport.width > 0 && viewport.height > 0) {
      onReady?.();
    }
  }, [onReady, viewport.height, viewport.width]);

  useEffect(() => {
    if (mode === "play") {
      setPlayCamera(cameraFromFocusPoint(requestedFocus, zoom, offsetX, offsetY));
    }
  }, [focusPointId, mode, offsetX, offsetY, requestedFocus, zoom]);

  useEffect(() => {
    if (mode !== "story") {
      restoreCameraRef.current = {
        ...playCamera,
        focusPointId,
      };
    }
  }, [focusPointId, mode, playCamera]);

  const animateStoryCamera = useCallback(
    (
      target: CameraState,
      durationMs: number,
      signal?: AbortSignal,
    ) =>
      new Promise<void>((resolve) => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        const current = storyCameraRef.current;
        const startCenter = getClampedCameraCenter(current, viewport, map);
        const targetCenter = getClampedCameraCenter(target, viewport, map);
        const start: CameraState = {
          focusX: startCenter.x,
          focusY: startCenter.y,
          zoom: current.zoom,
          offsetX: 0,
          offsetY: 0,
        };
        const end: CameraState = {
          focusX: targetCenter.x,
          focusY: targetCenter.y,
          zoom: target.zoom,
          offsetX: 0,
          offsetY: 0,
        };
        if (durationMs <= 0 || signal?.aborted) {
          setStoryCameraState(end);
          resolve();
          return;
        }

        const startedAt = performance.now();
        const finish = () => {
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          resolve();
        };
        const abort = () => finish();
        signal?.addEventListener("abort", abort, { once: true });

        const tick = (now: number) => {
          if (signal?.aborted) {
            finish();
            return;
          }

          const progress = Math.min((now - startedAt) / durationMs, 1);
          const eased =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          setStoryCameraState({
            focusX: start.focusX + (end.focusX - start.focusX) * eased,
            focusY: start.focusY + (end.focusY - start.focusY) * eased,
            zoom: start.zoom + (end.zoom - start.zoom) * eased,
            offsetX: 0,
            offsetY: 0,
          });

          if (progress >= 1) {
            signal?.removeEventListener("abort", abort);
            animationFrameRef.current = null;
            resolve();
            return;
          }
          animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);
      }),
    [map, setStoryCameraState, viewport],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: async (id, durationMs, signal) => {
        const point = map.focusPoints[id];
        if (!point) {
          if (import.meta.env.DEV) {
            console.warn(`[BaseCamp] Unknown focusPointId: ${id}`);
          }
          return;
        }
        await animateStoryCamera(cameraFromFocusPoint(point), durationMs, signal);
      },
      restore: async (durationMs, signal) => {
        await animateStoryCamera(restoreCameraRef.current, durationMs, signal);
      },
      getCameraSnapshot: () => ({
        ...storyCameraRef.current,
      }),
    }),
    [animateStoryCamera, map.focusPoints],
  );

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const camera = mode === "story" ? storyCamera : playCamera;

  const baseScale =
    viewport.width > 0 && viewport.height > 0
      ? Math.max(
          viewport.width / map.worldWidth,
          viewport.height / map.worldHeight,
        )
      : 1;
  const renderedScale = baseScale * camera.zoom;

  const transform = useMemo(() => {
    if (viewport.width === 0 || viewport.height === 0) {
      return "translate3d(0, 0, 0) scale(1)";
    }

    const center = getClampedCameraCenter(camera, viewport, map);
    const translateX = Math.round(viewport.width / 2 - center.x * renderedScale);
    const translateY = Math.round(viewport.height / 2 - center.y * renderedScale);

    return `translate3d(${translateX}px, ${translateY}px, 0) scale(${renderedScale})`;
  }, [camera, map.worldHeight, map.worldWidth, renderedScale, viewport]);

  const adjustZoom = useCallback((delta: number) => {
    setPlayCamera((current) => ({
      ...current,
      zoom: clamp(current.zoom + delta, MIN_ZOOM, MAX_ZOOM),
    }));
  }, []);

  return (
    <div
      ref={viewportRef}
      className="base-camp-viewport"
      data-testid="BaseCampViewport"
    >
      <div className="base-camp-world-transform" style={{ transform }}>
        <BaseCampWorld
          map={map}
          mode={mode}
          selectedRegionId={selectedRegionId}
          onSelectRegion={onSelectRegion}
          highlightTargetId={highlightTargetId}
        />
      </div>
      {mode === "play" && (
        <div className="base-camp-zoom-controls" aria-label="개발용 확대 축소">
          <span>개발용 ZOOM</span>
          <button type="button" onClick={() => adjustZoom(-0.1)}>
            −
          </button>
          <output>{playCamera.zoom.toFixed(1)}×</output>
          <button type="button" onClick={() => adjustZoom(0.1)}>
            +
          </button>
        </div>
      )}
    </div>
  );
});
