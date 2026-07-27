import type { PlayerState } from "../game/player/playerState";

type PlayerStatusBarProps = PlayerState & {
  questionLabel?: string;
};

export function getPlayerStatusView({
  level,
  currentHp,
  maxHp,
  questionLabel,
}: PlayerStatusBarProps) {
  const safeMaxHp = Math.max(1, maxHp);
  const safeHp = Math.min(Math.max(0, currentHp), safeMaxHp);
  return {
    level,
    currentHp: safeHp,
    maxHp: safeMaxHp,
    hpPercent: (safeHp / safeMaxHp) * 100,
    questionLabel,
  };
}

export function PlayerStatusBar(props: PlayerStatusBarProps) {
  const view = getPlayerStatusView(props);
  return (
    <div
      className="combat-status-bar player-status-bar"
      aria-label={`레벨 ${view.level}, 플레이어 체력 ${view.currentHp} / ${view.maxHp}${
        view.questionLabel ? `, ${view.questionLabel}` : ""
      }`}
    >
      <strong className="combat-status-level">LV.{view.level}</strong>
      <div className="combat-status-hp">
        <span>HP</span>
        <div
          className="player-hp-track"
          role="progressbar"
          aria-label="플레이어 HP"
          aria-valuemin={0}
          aria-valuemax={view.maxHp}
          aria-valuenow={view.currentHp}
        >
          <div
            className="player-hp-fill"
            style={{ width: `${view.hpPercent}%` }}
          />
        </div>
        <strong>{view.currentHp} / {view.maxHp}</strong>
      </div>
      {view.questionLabel && (
        <div className="combat-status-question">
          <span>QUESTION</span>
          <strong>{view.questionLabel}</strong>
        </div>
      )}
    </div>
  );
}

