import type { StoryRenderState } from "../../types/story";
import type { CSSProperties } from "react";
import {
  getStoryNpcAsset,
  STORY_NPC_DISPLAY_HEIGHT,
  STORY_NPC_DISPLAY_WIDTH,
  STORY_NPC_WALK_FPS,
  STORY_NPC_WALK_FRAME_COUNT,
} from "./storyNpcRegistry";

export function StoryNpcRenderer({ npcs }: { npcs: StoryRenderState["storyNpcs"] }) {
  return (
    <div className="story-npc-layer" aria-label="스토리 NPC">
      {Object.values(npcs).map((npc) => {
        const asset = getStoryNpcAsset(npc.actorId, npc.pose, npc.facing);
        if (!asset) return null;
        const style = {
          left: `${npc.x}%`,
          bottom: `${npc.y}%`,
          width: `${STORY_NPC_DISPLAY_WIDTH}%`,
          height: `${STORY_NPC_DISPLAY_HEIGHT}%`,
          transitionDuration: `${npc.durationMs}ms`,
          "--story-npc-sheet": `url("${asset}")`,
          "--story-npc-frame-count": STORY_NPC_WALK_FRAME_COUNT,
          "--story-npc-walk-duration": `${STORY_NPC_WALK_FRAME_COUNT / STORY_NPC_WALK_FPS}s`,
        } as CSSProperties;
        return (
          <div
            key={npc.actorId}
            className={`story-npc story-npc-${npc.pose.toLowerCase()}`}
            data-actor-id={npc.actorId}
            data-pose={npc.pose}
            data-facing={npc.facing}
            style={style}
          >
            <img
              className="story-npc-static-frame"
              src={asset}
              alt=""
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}
