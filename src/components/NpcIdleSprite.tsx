import { useEffect, useRef, useState } from "react";
import type { NpcDefinition } from "../game/npc/npcTypes";
import { resolveNextBlinkDelay } from "../game/npc/npcIdleResolver";

type NpcIdleSpriteProps = {
  npc: NpcDefinition;
  disabled: boolean;
  selected: boolean;
  onSelect: (npc: NpcDefinition) => void;
};

export function NpcIdleSprite({
  npc,
  disabled,
  selected,
  onSelect,
}: NpcIdleSpriteProps) {
  const [frame, setFrame] = useState<number | null>(null);
  const blinkTimerRef = useRef<number | null>(null);
  const frameTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    const clearTimers = () => {
      if (blinkTimerRef.current !== null) window.clearTimeout(blinkTimerRef.current);
      if (frameTimerRef.current !== null) window.clearInterval(frameTimerRef.current);
      blinkTimerRef.current = null;
      frameTimerRef.current = null;
    };
    const schedule = () => {
      blinkTimerRef.current = window.setTimeout(() => {
        if (disposed || frameTimerRef.current !== null) return;
        let nextFrame = 0;
        setFrame(nextFrame);
        frameTimerRef.current = window.setInterval(() => {
          nextFrame += 1;
          if (nextFrame >= npc.idle.blinkFrameCount) {
            if (frameTimerRef.current !== null) window.clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
            setFrame(null);
            schedule();
            return;
          }
          setFrame(nextFrame);
        }, npc.idle.blinkFrameDurationMs);
      }, resolveNextBlinkDelay(
        Math.random(),
        npc.idle.minBlinkIntervalMs,
        npc.idle.maxBlinkIntervalMs,
      ));
    };
    schedule();
    return () => {
      disposed = true;
      clearTimers();
    };
  }, [npc]);

  const backgroundSize = `${npc.placement.width * npc.idle.blinkFrameCount}px ${npc.placement.height}px`;

  return (
    <button
      type="button"
      className={`base-camp-npc ${selected ? "is-selected" : ""}`}
      style={{
        left: npc.placement.x,
        top: npc.placement.y,
        width: npc.placement.width,
        height: npc.placement.height,
      }}
      disabled={disabled}
      onClick={() => onSelect(npc)}
      aria-label={`${npc.displayName}, ${npc.role}와 대화하기`}
    >
      <span className="base-camp-npc-art" aria-hidden="true">
        {frame === null ? (
          <img src={npc.idle.standingImage} alt="" draggable={false} />
        ) : (
          <span
            className="base-camp-npc-blink"
            style={{
              backgroundImage: `url("${npc.idle.blinkSpriteSheet}")`,
              backgroundSize,
              backgroundPosition: `${-frame * npc.placement.width}px 0`,
            }}
          />
        )}
      </span>
      <span className="base-camp-npc-label">
        <strong>{npc.displayName}</strong>
        <small>대화하기</small>
      </span>
    </button>
  );
}
