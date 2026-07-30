import { getItemDefinition } from "../game/inventory/itemDefinitions";
import { ItemIcon } from "./ItemIcon";
import { getQuestRareRewardCondition } from "../game/quest/questRareRewardConditions";

const memoryQuestRareRewardCondition = getQuestRareRewardCondition(
  "quest-floor-1-memory-fragment",
);

export function QuestRewardPopup({ bestCorrect, claimed, onClaim, onCancel }: {
  bestCorrect: number;
  claimed: boolean;
  onClaim: () => void;
  onCancel: () => void;
}) {
  const required = memoryQuestRareRewardCondition.requiredCorrect;
  const rareUnlocked = bestCorrect >= required;
  const skin = getItemDefinition("weapon-gojoseon-bronze-dagger")!;
  return (
    <div className="pixel-popup-backdrop">
      <section className="pixel-rpg-popup quest-reward-popup" role="dialog" aria-modal="true" aria-labelledby="quest-reward-title">
        <header><p className="eyebrow">QUEST COMPLETE</p><h2 id="quest-reward-title">기억 조각 회수 완료</h2></header>
        <div className="quest-reward-grid">
          <article><p className="eyebrow">기본 보상</p><span className="reward-icon">G</span><strong>5 Gold</strong><small>퀘스트 완료 기본 보상</small></article>
          <article className={rareUnlocked ? "is-unlocked" : "is-locked"}>
            <p className="eyebrow">희귀 보상</p><span className="reward-icon"><ItemIcon item={skin} /></span><strong>{skin.name}</strong>
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
