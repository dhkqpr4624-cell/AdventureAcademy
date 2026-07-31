import { useMemo } from "react";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { StorySequence } from "../types/story";

export function TornClothEvent({
  imageUrl,
  onComplete,
}: {
  imageUrl: string;
  onComplete: () => void;
}) {
  const sequence = useMemo<StorySequence>(() => ({
    id: "floor-2-torn-cloth-found",
    title: "천 조각 발견",
    replayable: false,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {},
    actors: {},
    scenes: [{
      id: "floor-2-torn-cloth-found-scene",
      steps: [
        {
          id: "torn-cloth-line-1",
          type: "narration",
          text: "이것은?",
          advanceMode: "click",
        },
        {
          id: "torn-cloth-line-2",
          type: "narration",
          text: "옷의 일부분이 찢어진 것 같다.",
          advanceMode: "click",
        },
        {
          id: "torn-cloth-line-3",
          type: "narration",
          text: "베이스 캠프로 돌아가서\n루나에게 보여주자.",
          advanceMode: "click",
        },
      ],
    }],
  }), []);

  return (
    <>
      <div className="dungeon-room-event-image">
        <img
          className="is-revealing"
          src={imageUrl}
          alt="던전 2층에서 발견한 찢어진 천 조각"
        />
      </div>
      <div className="base-camp-story-overlay">
        <StoryPlayer
          sequence={sequence}
          onNavigate={() => undefined}
          onComplete={onComplete}
          presentationMode="baseCampOverlay"
        />
      </div>
    </>
  );
}
