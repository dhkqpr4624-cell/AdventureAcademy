type Props = { disabled: boolean; onClick: () => void };

export function DungeonExitButton({ disabled, onClick }: Props) {
  return (
    <button className="dungeon-exit-button" type="button" disabled={disabled} onClick={onClick} aria-label="던전 나가기" title="던전 나가기">
      <span className="dungeon-exit-icon" aria-hidden="true" />
      <span>나가기</span>
    </button>
  );
}
