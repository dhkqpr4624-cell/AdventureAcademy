type Props = {
  busy: boolean;
  onRetry: () => void;
  onReturnToBaseCamp: () => void;
};

export function PlayerDefeatedOverlay({ busy, onRetry, onReturnToBaseCamp }: Props) {
  return (
    <div className="dungeon-modal-backdrop dungeon-defeated-backdrop" role="presentation">
      <section className="dungeon-modal-panel" role="dialog" aria-modal="true" aria-labelledby="defeated-title">
        <p className="eyebrow">DUNGEON CHALLENGE</p>
        <h2 id="defeated-title">쓰러졌습니다!</h2>
        <p>잠시 정비한 뒤 다시 도전해 보자.</p>
        <div className="button-group">
          <button type="button" disabled={busy} onClick={onRetry}>다시 도전하기</button>
          <button type="button" disabled={busy} onClick={onReturnToBaseCamp}>베이스 캠프로 돌아가기</button>
        </div>
      </section>
    </div>
  );
}
