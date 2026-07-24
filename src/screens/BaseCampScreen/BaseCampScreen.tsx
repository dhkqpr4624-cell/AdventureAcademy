import { useState } from "react";
import type { ScreenId } from "../../app/routes";
import { BASE_CAMP_MAP } from "../../data/baseCampMap";
import type {
  BaseCampInteractionRegion,
  BaseCampMode,
} from "../../types/baseCamp";
import { BaseCampViewport } from "./BaseCampViewport";

type BaseCampScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function BaseCampScreen({ onNavigate }: BaseCampScreenProps) {
  const [mode, setMode] = useState<BaseCampMode>("play");
  const [focusPointId, setFocusPointId] = useState("campCenter");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const handleSelectRegion = (region: BaseCampInteractionRegion) => {
    setSelectedRegionId(region.id);
    setFocusPointId(region.id);
  };

  return (
    <main className="game-screen base-camp-screen">
      <BaseCampViewport
        map={BASE_CAMP_MAP}
        mode={mode}
        focusPointId={focusPointId}
        selectedRegionId={selectedRegionId}
        onSelectRegion={handleSelectRegion}
      />
      <header className="base-camp-hud">
        <p className="eyebrow">BASE CAMP · FOUNDATION</p>
        <div className="base-camp-dev-status">
          <span>모드: {mode}</span>
          <span>포커스: {focusPointId}</span>
          <span>선택: {selectedRegionId ?? "없음"}</span>
        </div>
      </header>
      <nav className="base-camp-dev-controls" aria-label="베이스캠프 개발용 조작">
        <span>개발용 화면 전환 / 카메라 확인</span>
        <div>
          {Object.keys(BASE_CAMP_MAP.focusPoints).map((id) => (
            <button key={id} type="button" onClick={() => setFocusPointId(id)}>
              {id}
            </button>
          ))}
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              setMode((current) => (current === "play" ? "story" : "play"));
              setSelectedRegionId(null);
            }}
          >
            {mode === "play" ? "story 입력 차단 확인" : "play 모드로"}
          </button>
          <button type="button" onClick={() => onNavigate("story")}>
            이야기
          </button>
          <button type="button" onClick={() => onNavigate("dungeon")}>
            던전
          </button>
          <button type="button" onClick={() => onNavigate("title")}>
            타이틀
          </button>
        </div>
      </nav>
    </main>
  );
}
