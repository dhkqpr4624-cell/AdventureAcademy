import { getItemDefinition } from "../game/inventory/itemDefinitions";
import { ItemIcon } from "./ItemIcon";

export function QuestRewardPopup({
  bestCorrect,
  claimed,
  questTitle = "기억 조각 회수 완료",
  rareRewardItemId = "weapon-gojoseon-bronze-dagger",
  requiredCorrect = 6,
  onClaim,
  onCancel,
}: {
  bestCorrect: number;
  claimed: boolean;
  questTitle?: string;
  rareRewardItemId?: string;
  requiredCorrect?: number;
  onClaim: () => void;
  onCancel: () => void;
}) {
  const required = requiredCorrect;
  const rareUnlocked = bestCorrect >= required;
  const rareReward = getItemDefinition(rareRewardItemId)!;
  return (
    <div className="pixel-popup-backdrop">
      <section className="pixel-rpg-popup quest-reward-popup" role="dialog" aria-modal="true" aria-labelledby="quest-reward-title">
        <header><p className="eyebrow">QUEST COMPLETE</p><h2 id="quest-reward-title">{questTitle}</h2></header>
        <div className="quest-reward-grid">
          <article><p className="eyebrow">기본 보상</p><span className="reward-icon">G</span><strong>5 Gold</strong><small>퀘스트 완료 기본 보상</small></article>
          <article className={rareUnlocked ? "is-unlocked" : "is-locked"}>
            <p className="eyebrow">희귀 보상</p><span className="reward-icon"><ItemIcon item={rareReward} /></span><strong>{rareReward.name}</strong>
            <small className={rareUnlocked ? "" : "reward-condition-failed"}>정답 {bestCorrect} / {required}</small>
          </article>
        </div>
        <div className="quest-reward-actions">
          <button type="button" disabled={claimed} onClick={onClaim}>{claimed ? "수령 완료" : "보상 받기"}</button>
          <button type="button" onClick={onCancel}>취소</button>
        </div>
      </section>
    </div>
  );
}
