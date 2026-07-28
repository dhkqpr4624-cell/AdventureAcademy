import type { ScreenId } from "../../app/routes";

type TitleScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  onOpenSettings: () => void;
  hasSave: boolean;
  onNewGame: () => void;
};

export function TitleScreen({ onNavigate, onOpenSettings, hasSave, onNewGame }: TitleScreenProps) {
  return (
    <main className="game-screen title-screen">
      <section className="screen-panel title-panel">
        <p className="eyebrow">5학년 2학기 1단원</p>
        <h1>Adventure Academy</h1>
        <p className="korean-title">어드벤처 아카데미</p>
        <p className="screen-description">
          지식의 문을 열고, 새로운 모험을 시작하세요.
        </p>
        <div className="button-group">
          <button type="button" onClick={onNewGame}>
            새로 시작하기
          </button>
          <button type="button" disabled={!hasSave} onClick={() => onNavigate("baseCamp")}>이어하기</button>
          <button type="button" onClick={onOpenSettings}>설정</button>
          <button type="button" onClick={() => onNavigate("baseCamp")}>
            베이스캠프 미리 보기
          </button>
          <button type="button" onClick={() => onNavigate("dungeon")}>
            던전 미리 보기
          </button>
          <button type="button" onClick={() => onNavigate("question")}>
            퀴즈 테스트
          </button>
        </div>
        <p className="placeholder-note">현재는 프로젝트 기반 확인용 임시 화면입니다.</p>
      </section>
    </main>
  );
}
