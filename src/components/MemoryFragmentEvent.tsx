export function MemoryFragmentEvent({ imageUrl, onComplete }: { imageUrl: string; onComplete: () => void }) {
  const lines = [
    "뒤틀린 기억의 조각을 찾았다.",
    "카이든 대장이 가지고 있는 조각과\n딱 맞을 것 같다.",
    "베이스 캠프로 돌아가서\n카이든에게 보고하자.",
  ];
  return (
    <div className="quest-cinematic-overlay">
      <img className="quest-cinematic-image" src={imageUrl} alt="던전에서 발견한 뒤틀린 기억의 조각" />
      <div className="quest-cinematic-dialogue">
        {lines.map((line) => <p key={line}>{line}</p>)}
        <button type="button" onClick={onComplete}>베이스 캠프로 돌아가기</button>
      </div>
    </div>
  );
}

export function DungeonReturnPrompt({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="dungeon-modal-backdrop">
      <section className="dungeon-modal-panel" role="dialog" aria-modal="true">
        <p>출구가 보인다.</p><p>베이스 캠프로 돌아갈까?</p>
        <h2>베이스 캠프로 돌아갈까요?</h2>
        <div className="button-group"><button type="button" onClick={onConfirm}>예</button><button type="button" onClick={onCancel}>아니오</button></div>
      </section>
    </div>
  );
}
