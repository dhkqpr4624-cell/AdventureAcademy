import { useEffect, useRef, useState } from "react";
import type {
  BaseCampFocusPoint,
  BaseCampMapDefinition,
  BaseCampMode,
} from "../../types/baseCamp";

export type BaseCampCameraDiagnostics = {
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  baseScale: number;
  zoom: number;
  cameraCenterX: number;
  cameraCenterY: number;
  offsetX: number;
  offsetY: number;
  requestedX: number;
  requestedY: number;
  offsetTargetX: number;
  offsetTargetY: number;
  clampedX: number;
  clampedY: number;
  visibleWorldWidth: number;
  visibleWorldHeight: number;
};

export type BaseCampFocusDraft = BaseCampFocusPoint & {
  durationMs: number;
};

type BaseCampFocusDevToolProps = {
  mode: BaseCampMode;
  map: BaseCampMapDefinition;
  diagnostics: BaseCampCameraDiagnostics;
  clickedWorld: { x: number; y: number } | null;
  onDraftChange: (draft: BaseCampFocusDraft) => void;
  onTestMove: (draft: BaseCampFocusDraft) => void;
  onResetCamera: () => void;
};

const DEFAULT_DRAFT: BaseCampFocusDraft = {
  id: "newFocusPoint",
  x: 0,
  y: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  durationMs: 900,
};

const format = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : "0.00";

export function BaseCampFocusDevTool({
  mode,
  map,
  diagnostics,
  clickedWorld,
  onDraftChange,
  onTestMove,
  onResetCamera,
}: BaseCampFocusDevToolProps) {
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [copyStatus, setCopyStatus] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const fallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onDraftChange(draft);
  }, [draft, onDraftChange]);

  useEffect(() => {
    if (!copyStatus) {
      return;
    }
    const timeout = window.setTimeout(() => setCopyStatus(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const updateNumber = (
    key: "x" | "y" | "zoom" | "offsetX" | "offsetY" | "durationMs",
    value: string,
  ) => {
    const parsed = Number(value);
    setDraft((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const loadFocusPoint = (id: string) => {
    const point = map.focusPoints[id];
    if (!point) {
      return;
    }
    setDraft((current) => ({
      ...current,
      id: point.id,
      x: point.x,
      y: point.y,
      zoom: point.zoom,
      offsetX: point.offsetX ?? 0,
      offsetY: point.offsetY ?? 0,
    }));
  };

  const getJson = () =>
    JSON.stringify(
      {
        id: draft.id,
        x: draft.x,
        y: draft.y,
        zoom: draft.zoom,
        offsetX: draft.offsetX ?? 0,
        offsetY: draft.offsetY ?? 0,
      },
      null,
      2,
    );

  const copyJson = async () => {
    const json = getJson();
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(json);
      setFallbackText("");
      setCopyStatus("복사 성공");
    } catch {
      setFallbackText(json);
      setCopyStatus("자동 복사 실패 · 아래 텍스트를 복사하세요");
      window.setTimeout(() => {
        fallbackRef.current?.focus();
        fallbackRef.current?.select();
        try {
          if (document.execCommand("copy")) {
            setCopyStatus("fallback 복사 성공");
          }
        } catch {
          // 선택 가능한 textarea가 최종 fallback이다.
        }
      }, 0);
    }
  };

  return (
    <aside className="base-camp-focus-dev-tool" aria-label="BaseCamp focus point 개발 도구">
      <strong>DEV · FOCUS POINT TOOL</strong>
      <div className="base-camp-focus-dev-grid">
        <span>mode</span><output>{mode}</output>
        <span>viewport</span><output>{format(diagnostics.viewportWidth)} × {format(diagnostics.viewportHeight)}</output>
        <span>world</span><output>{diagnostics.worldWidth} × {diagnostics.worldHeight}</output>
        <span>baseScale</span><output>{format(diagnostics.baseScale)}</output>
        <span>zoom</span><output>{format(diagnostics.zoom)}</output>
        <span>camera center</span><output>{format(diagnostics.cameraCenterX)}, {format(diagnostics.cameraCenterY)}</output>
        <span>offset</span><output>{format(diagnostics.offsetX)}, {format(diagnostics.offsetY)}</output>
        <span>clicked world</span><output>{clickedWorld ? `${format(clickedWorld.x)}, ${format(clickedWorld.y)}` : "—"}</output>
        <span>requested</span><output>{format(diagnostics.requestedX)}, {format(diagnostics.requestedY)}</output>
        <span>offset target</span><output>{format(diagnostics.offsetTargetX)}, {format(diagnostics.offsetTargetY)}</output>
        <span>clamped</span><output>{format(diagnostics.clampedX)}, {format(diagnostics.clampedY)}</output>
        <span>visible world</span><output>{format(diagnostics.visibleWorldWidth)} × {format(diagnostics.visibleWorldHeight)}</output>
      </div>

      <div className="base-camp-focus-dev-fields">
        <label>ID<input value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))} /></label>
        {(["x", "y", "zoom", "offsetX", "offsetY", "durationMs"] as const).map((key) => (
          <label key={key}>{key}<input type="number" step={key === "zoom" ? "0.05" : "1"} value={draft[key] ?? 0} onChange={(event) => updateNumber(key, event.target.value)} /></label>
        ))}
      </div>

      <div className="base-camp-focus-dev-buttons">
        <button type="button" disabled={!clickedWorld} onClick={() => clickedWorld && setDraft((current) => ({ ...current, x: Math.round(clickedWorld.x), y: Math.round(clickedWorld.y) }))}>클릭 좌표 반영</button>
        <button type="button" onClick={() => onTestMove(draft)}>테스트 이동</button>
        {["campCenter", "shop", "dungeonEntrance", "questNpc01"].map((id) => (
          <button key={id} type="button" onClick={() => loadFocusPoint(id)}>{id} 불러오기</button>
        ))}
        <button type="button" onClick={copyJson}>JSON 복사</button>
        <button type="button" onClick={onResetCamera}>카메라 초기화</button>
      </div>
      {copyStatus && <output className="base-camp-focus-copy-status">{copyStatus}</output>}
      {fallbackText && <textarea ref={fallbackRef} readOnly value={fallbackText} aria-label="수동 복사용 JSON" />}
    </aside>
  );
}
