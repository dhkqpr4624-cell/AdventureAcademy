type Props = { busy: boolean; onCancel: () => void; onConfirm: () => void };

export function DungeonExitConfirmDialog({ busy, onCancel, onConfirm }: Props) {
  return (
    <div className="dungeon-modal-backdrop" role="presentation">
      <section className="dungeon-modal-panel" role="dialog" aria-modal="true" aria-labelledby="exit-title">
        <h2 id="exit-title">던전에서 나가시겠습니까?</h2>
        <p>현재 탐험의 진행 상황은 저장되지 않습니다.<br />정말 나가시겠습니까?</p>
        <div className="button-group">
          <button type="button" autoFocus disabled={busy} onClick={onCancel}>계속 탐험하기</button>
          <button type="button" className="is-danger" disabled={busy} onClick={onConfirm}>던전 나가기</button>
        </div>
      </section>
    </div>
  );
}
