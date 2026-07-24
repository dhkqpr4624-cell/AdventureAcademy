import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getBaseCampMap } from "../../data/baseCampMaps";
import {
  BaseCampViewport,
  type BaseCampViewportController,
} from "../../screens/BaseCampScreen/BaseCampViewport";

export type BaseCampStoryController = {
  focus: (
    focusPointId: string,
    durationMs: number,
    signal?: AbortSignal,
  ) => Promise<void>;
  highlight: (targetId: string) => Promise<void>;
  clearHighlight: () => Promise<void>;
  restore: (durationMs: number, signal?: AbortSignal) => Promise<void>;
};

type BaseCampStoryAdapterProps = {
  mapId: string;
  onReady: () => void;
};

export const BaseCampStoryAdapter = forwardRef<
  BaseCampStoryController,
  BaseCampStoryAdapterProps
>(function BaseCampStoryAdapter({ mapId, onReady }, forwardedRef) {
  const viewportControllerRef = useRef<BaseCampViewportController>(null);
  const [highlightTargetId, setHighlightTargetId] = useState<string | null>(null);
  const map = getBaseCampMap(mapId);

  const warn = useCallback((message: string) => {
    if (import.meta.env.DEV) {
      console.warn(`[BaseCampStoryAdapter] ${message}`);
    }
  }, []);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: async (focusPointId, durationMs, signal) => {
        if (!map?.focusPoints[focusPointId]) {
          warn(`Unknown focusPointId "${focusPointId}" for map "${mapId}".`);
          return;
        }
        if (!viewportControllerRef.current) {
          warn("Camera controller is not ready; focus step was skipped.");
          return;
        }
        await viewportControllerRef.current.focus(
          focusPointId,
          durationMs,
          signal,
        );
      },
      highlight: async (targetId) => {
        if (!map?.interactionRegions.some((region) => region.id === targetId)) {
          warn(`Unknown targetId "${targetId}" for map "${mapId}".`);
          return;
        }
        setHighlightTargetId(targetId);
      },
      clearHighlight: async () => {
        setHighlightTargetId(null);
      },
      restore: async (durationMs, signal) => {
        if (!viewportControllerRef.current) {
          warn("Camera controller is not ready; restore step was skipped.");
          return;
        }
        await viewportControllerRef.current.restore(durationMs, signal);
      },
    }),
    [map, mapId, warn],
  );

  if (!map) {
    warn(`Unknown mapId "${mapId}".`);
    return null;
  }

  return (
    <div className="story-base-camp-layer">
      <BaseCampViewport
        ref={viewportControllerRef}
        map={map}
        mode="story"
        focusPointId="campCenter"
        selectedRegionId={null}
        highlightTargetId={highlightTargetId}
        onSelectRegion={() => undefined}
        onReady={onReady}
      />
    </div>
  );
});
