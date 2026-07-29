import { StoryPlayer } from "../game/story/StoryPlayer";
import type { StorySequence } from "../types/story";

function createMemoryFragmentSequence(imageUrl: string): StorySequence {
  return {
    id: "floor-1-memory-fragment-found",
    title: "뒤틀린 기억의 조각 발견",
    replayable: false,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {
      fragment: {
        imageUrl,
        placeholder: {
          label: "뒤틀린 기억의 조각",
          gradient: "linear-gradient(#050505, #000000)",
        },
      },
    },
    actors: {},
    scenes: [{
      id: "floor-1-memory-fragment-found-scene",
      steps: [
        {
          id: "memory-fragment-background",
          type: "setBackground",
          backgroundId: "fragment",
          transition: "fade",
          durationMs: 900,
        },
        {
          id: "memory-fragment-line-1",
          type: "narration",
          text: "뒤틀린 기억의 조각을 찾았다.",
          advanceMode: "click",
        },
        {
          id: "memory-fragment-line-2",
          type: "narration",
          text: "카이든 대장이 가지고 있는 조각과\n딱 맞을 것 같다.",
          advanceMode: "click",
        },
        {
          id: "memory-fragment-line-3",
          type: "narration",
          text: "베이스 캠프로 돌아가서\n카이든에게 보고하자.",
          advanceMode: "click",
        },
      ],
    }],
  };
}

export function MemoryFragmentEvent({ imageUrl, onComplete }: { imageUrl: string; onComplete: () => void }) {
  return (
    <div className="quest-story-overlay">
      <StoryPlayer
        sequence={createMemoryFragmentSequence(imageUrl)}
        onNavigate={() => undefined}
        onComplete={onComplete}
      />
    </div>
  );
}

export function DungeonReturnPrompt({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="dungeon-modal-backdrop">
      <section className="dungeon-modal-panel" role="dialog" aria-modal="true">
        <p>출구가 보인다.</p><p>베이스 캠프로 돌아갈까?</p>
        <h2>베이스 캠프로 돌아갈까요?</h2>
        <div className="button-group"><button type="button" onClick={onConfirm}>예</button><button type="button" onClick={onCancel}>아니오</button></div>
      </section>
    </div>
  );
}
