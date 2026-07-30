import { useEffect, useRef, useState } from "react";
import type { NpcDefinition } from "../game/npc/npcTypes";
import { resolveNextBlinkDelay } from "../game/npc/npcIdleResolver";

type NpcIdleSpriteProps = {
  npc: NpcDefinition;
  selected: boolean;
  interactionHighlighted: boolean;
};

export function NpcIdleSprite({
  npc,
  selected,
  interactionHighlighted,
}: NpcIdleSpriteProps) {
  const [frame, setFrame] = useState<number | null>(null);
  const [blinkTextureReady, setBlinkTextureReady] = useState(false);
  const blinkTimerRef = useRef<number | null>(null);
  const frameTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    const blinkTexture = new Image();
    blinkTexture.onload = () => {
      if (!disposed) setBlinkTextureReady(true);
    };
    blinkTexture.onerror = () => {
      if (!disposed) setBlinkTextureReady(false);
    };
    blinkTexture.src = npc.idle.blinkSpriteSheet;

    if (blinkTexture.complete && blinkTexture.naturalWidth > 0) {
      setBlinkTextureReady(true);
    }

    return () => {
      disposed = true;
      blinkTexture.onload = null;
      blinkTexture.onerror = null;
    };
  }, [npc.idle.blinkSpriteSheet]);

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
        if (!blinkTextureReady) {
          schedule();
          return;
        }
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
  }, [blinkTextureReady, npc]);

  const backgroundSize = `${npc.placement.width * npc.idle.blinkFrameCount}px ${npc.placement.height}px`;

  return (
    <div
      className={`base-camp-npc-art-container ${
        selected ? "is-selected" : ""
      } ${
        interactionHighlighted ? "is-interaction-highlighted" : ""
      }`}
      style={{
        left: npc.placement.x,
        top: npc.placement.y,
        width: npc.placement.width,
        height: npc.placement.height,
      }}
      aria-hidden="true"
    >
      <span className="base-camp-npc-art" aria-hidden="true">
        <img src={npc.idle.standingImage} alt="" draggable={false} />
        <span
          className={`base-camp-npc-blink ${frame === null ? "" : "is-visible"}`}
          style={{
            backgroundImage: `url("${npc.idle.blinkSpriteSheet}")`,
            backgroundSize,
            backgroundPosition: `${-(frame ?? 0) * npc.placement.width}px 0`,
          }}
        />
      </span>
    </div>
  );
}
