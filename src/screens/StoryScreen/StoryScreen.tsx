import { useState } from "react";
import type { ScreenId } from "../../app/routes";
import { BASE_CAMP_TEST_STORY_SEQUENCE } from "../../data/stories/baseCampTestStory";
import { TEST_STORY_SEQUENCE } from "../../data/stories/testStory";
import { StoryPlayer } from "../../game/story/StoryPlayer";
import type { StorySequence } from "../../types/story";

type StoryScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function StoryScreen({ onNavigate }: StoryScreenProps) {
  const [sequence, setSequence] = useState<StorySequence | null>(null);

  if (sequence) {
    return (
      <StoryPlayer
        key={sequence.id}
        sequence={sequence}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <main className="game-screen story-test-selector">
      <section className="screen-panel">
        <p className="eyebrow">DEVELOPER STORY TEST</p>
        <h1>스토리 테스트 선택</h1>
        <p className="screen-description">
          일반 이미지 스토리와 베이스캠프 카메라 연출을 각각 확인합니다.
        </p>
        <div className="button-group">
          <button type="button" onClick={() => setSequence(TEST_STORY_SEQUENCE)}>
            일반 테스트 스토리
          </button>
          <button
            type="button"
            onClick={() => setSequence(BASE_CAMP_TEST_STORY_SEQUENCE)}
          >
            베이스캠프 테스트 스토리
          </button>
          <button type="button" onClick={() => onNavigate("title")}>
            타이틀로
          </button>
        </div>
        <p className="placeholder-note">개발용 진입 화면입니다.</p>
      </section>
    </main>
  );
}
