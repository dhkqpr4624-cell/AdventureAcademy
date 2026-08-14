import { useEffect, useState } from "react";
import type { ScreenId } from "../../app/routes";

export function isDebugToggleShortcut(event: Pick<KeyboardEvent, "ctrlKey" | "shiftKey" | "key">) {
  return event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d";
}

type TitleScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  onOpenSettings: () => void;
  hasSave: boolean;
  onNewGame: () => void;
  onDebugFloorJump: (floorId: "floor-1" | "floor-2" | "floor-3" | "floor-4" | "floor-5") => void;
};

export function TitleScreen({ onNavigate, onOpenSettings, hasSave, onNewGame, onDebugFloorJump }: TitleScreenProps) {
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isDebugToggleShortcut(event) || event.repeat) return;
      event.preventDefault();
      setDebugVisible((visible) => {
        if (visible) setDebugOpen(false);
        return !visible;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="game-screen title-screen">
      <img
        className="title-background"
        src={`${import.meta.env.BASE_URL}assets/title/title-background.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      <button className="title-settings-button" type="button" onClick={onOpenSettings}>
        설정
      </button>

      {debugVisible && <div className="title-debug-floor-jump">
        <button className="title-debug-toggle" type="button" onClick={() => setDebugOpen((open) => !open)}>[DEBUG]</button>
        {debugOpen && <div className="title-debug-panel" aria-label="던전 층 테스트 이동">
          {([1, 2, 3, 4, 5] as const).map((floor) => <button key={floor} type="button" onClick={() => onDebugFloorJump(`floor-${floor}`)}>Dungeon {floor}</button>)}
        </div>}
      </div>}

      <section className="title-primary-controls" aria-label="게임 시작 메뉴">
        <p className="title-unit-label">&lt;5학년 2학기 1단원&gt;</p>
        <div className="title-primary-buttons">
          <button type="button" onClick={onNewGame}>
            새로 시작하기
          </button>
          <button type="button" disabled={!hasSave} onClick={() => onNavigate("baseCamp")}>
            이어하기
          </button>
        </div>
      </section>
    </main>
  );
}
