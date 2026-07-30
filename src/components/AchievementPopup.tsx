import { ACHIEVEMENT_DEFINITIONS } from "../data/achievementDefinitions";

export function AchievementPopup({
  floorBestCorrect,
  achievementReceived,
  onClaim,
  onClose,
}: {
  floorBestCorrect: Record<string, number>;
  achievementReceived: Record<string, boolean>;
  onClaim: (achievementId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="pixel-popup-backdrop achievement-backdrop" role="presentation">
      <section className="achievement-popup" role="dialog" aria-modal="true" aria-labelledby="achievement-title">
        <header className="achievement-popup-header">
          <div>
            <p className="eyebrow">ACHIEVEMENT</p>
            <h2 id="achievement-title">업적</h2>
          </div>
          <button type="button" className="achievement-close-button" onClick={onClose} aria-label="업적 닫기">×</button>
        </header>
        <div className="achievement-list">
          {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
            const progress = Math.min(
              floorBestCorrect[achievement.floorId] ?? 0,
              achievement.totalQuestions,
            );
            const received = Boolean(achievementReceived[achievement.id]);
            const completed = progress >= achievement.requiredCorrect;
            return (
              <article className={`achievement-card ${received ? "is-received" : completed ? "is-completed" : "is-progress"}`} key={achievement.id}>
                <div className="achievement-floor-medal" aria-hidden="true">★</div>
                <div className="achievement-card-copy">
                  <small>{achievement.floorTitle}</small>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                  <b className={completed ? "is-ready" : ""}>{progress} / {achievement.totalQuestions}</b>
                </div>
                <div className="achievement-reward">
                  <span>희귀 보상</span>
                  <img src={achievement.rewardIcon} alt={achievement.title} draggable={false} />
                </div>
                <div className="achievement-card-action">
                  <span className="achievement-state">{received ? "완료" : completed ? "달성" : "진행 중"}</span>
                  <button
                    type="button"
                    disabled={!completed || received}
                    onClick={() => onClaim(achievement.id)}
                  >
                    {received ? "받음" : "받기"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <footer><button type="button" onClick={onClose}>닫기</button></footer>
      </section>
    </div>
  );
}
