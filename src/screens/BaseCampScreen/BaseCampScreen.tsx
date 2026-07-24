import type { ScreenId } from "../../app/routes";

type BaseCampScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function BaseCampScreen({ onNavigate }: BaseCampScreenProps) {
  return (
    <main className="game-screen base-camp-screen">
      <section className="screen-panel">
        <p className="eyebrow">BASE CAMP</p>
        <h1>BaseCampScreen</h1>
        <p className="screen-description">
          NPC, 상점, 던전 입구가 배치될 베이스캠프의 임시 화면입니다.
        </p>
        <div className="button-group">
          <button type="button" onClick={() => onNavigate("story")}>
            이야기 화면으로
          </button>
          <button type="button" onClick={() => onNavigate("dungeon")}>
            던전으로
          </button>
          <button type="button" onClick={() => onNavigate("title")}>
            타이틀로
          </button>
        </div>
      </section>
    </main>
  );
}
