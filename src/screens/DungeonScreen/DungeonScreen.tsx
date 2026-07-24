import { REVISION } from "three";
import type { ScreenId } from "../../app/routes";

type DungeonScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function DungeonScreen({ onNavigate }: DungeonScreenProps) {
  return (
    <main className="game-screen dungeon-screen">
      <section className="screen-panel">
        <p className="eyebrow">DUNGEON</p>
        <h1>DungeonScreen</h1>
        <p className="screen-description">
          Three.js 던전 장면이 들어갈 임시 화면입니다. 현재 단계에서는 실제
          렌더링이나 이동을 구현하지 않습니다.
        </p>
        <p className="tech-status">Three.js r{REVISION} 연결 확인</p>
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
