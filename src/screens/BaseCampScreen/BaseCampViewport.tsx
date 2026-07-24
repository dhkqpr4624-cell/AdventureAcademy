import {
  useCallback,
  useEffect,
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

export function BaseCampViewport({
  map,
  mode,
  focusPointId = "campCenter",
  zoom,
  offsetX,
  offsetY,
  selectedRegionId,
  onSelectRegion,
}: BaseCampViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const defaultFocus = map.focusPoints.campCenter;
  const requestedFocus = map.focusPoints[focusPointId] ?? defaultFocus;
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [playCamera, setPlayCamera] = useState<CameraState>(() =>
    cameraFromFocusPoint(defaultFocus),
  );

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
    if (mode === "play") {
      setPlayCamera(cameraFromFocusPoint(requestedFocus, zoom, offsetX, offsetY));
    }
  }, [focusPointId, mode, offsetX, offsetY, requestedFocus, zoom]);

  const camera =
    mode === "story"
      ? cameraFromFocusPoint(requestedFocus, zoom, offsetX, offsetY)
      : playCamera;

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

    const visibleWorldWidth = viewport.width / renderedScale;
    const visibleWorldHeight = viewport.height / renderedScale;
    const halfWidth = visibleWorldWidth / 2;
    const halfHeight = visibleWorldHeight / 2;
    const minimumX = halfWidth;
    const maximumX = map.worldWidth - halfWidth;
    const minimumY = halfHeight;
    const maximumY = map.worldHeight - halfHeight;
    const requestedX = camera.focusX + camera.offsetX;
    const requestedY = camera.focusY + camera.offsetY;
    const centerX =
      minimumX > maximumX
        ? map.worldWidth / 2
        : clamp(requestedX, minimumX, maximumX);
    const centerY =
      minimumY > maximumY
        ? map.worldHeight / 2
        : clamp(requestedY, minimumY, maximumY);
    const translateX = Math.round(viewport.width / 2 - centerX * renderedScale);
    const translateY = Math.round(viewport.height / 2 - centerY * renderedScale);

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
}
