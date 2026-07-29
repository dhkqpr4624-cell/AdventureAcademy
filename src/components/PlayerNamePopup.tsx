import { useState } from "react";

export function PlayerNamePopup({ onConfirm, onCancel }: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const normalized = name.trim().replace(/\s+/g, " ").slice(0, 12);
  return (
    <div className="pixel-popup-backdrop player-name-backdrop">
      <form className="pixel-rpg-popup player-name-popup" onSubmit={(event) => {
        event.preventDefault();
        if (normalized) onConfirm(normalized);
      }}>
        <header><p className="eyebrow">NEW ADVENTURE</p><h2>플레이어 이름</h2></header>
        <div className="player-name-body">
          <label htmlFor="player-name">NPC들이 어떤 이름으로 부르면 좋을까요?</label>
          <input id="player-name" autoFocus maxLength={12} value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력하세요" />
          <small>{normalized.length} / 12</small>
        </div>
        <div className="quest-reward-actions">
          <button type="submit" disabled={!normalized}>확인</button>
          <button type="button" onClick={onCancel}>취소</button>
        </div>
      </form>
    </div>
  );
}
