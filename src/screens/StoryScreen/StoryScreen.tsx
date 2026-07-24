import type { ScreenId } from "../../app/routes";

type StoryScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function StoryScreen({ onNavigate }: StoryScreenProps) {
  return (
    <main className="game-screen story-screen">
      <section className="screen-panel">
        <p className="eyebrow">STORY</p>
        <h1>StoryScreen</h1>
        <p className="screen-description">
          인트로와 퀘스트 대화가 표시될 자리입니다. 실제 StoryPlayer는 아직
          구현하지 않았습니다.
        </p>
        <div className="button-group">
          <button type="button" onClick={() => onNavigate("baseCamp")}>
            베이스캠프로
          </button>
          <button type="button" onClick={() => onNavigate("title")}>
            타이틀로
          </button>
        </div>
      </section>
    </main>
  );
}
