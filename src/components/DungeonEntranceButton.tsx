import type { BaseCampInteractionRegion } from "../types/baseCamp";

type DungeonEntranceButtonProps = {
  region: BaseCampInteractionRegion;
  disabled: boolean;
  selected: boolean;
  onClick: () => void;
  onHighlightChange: (highlighted: boolean) => void;
};

export function DungeonEntranceButton({
  region,
  disabled,
  selected,
  onClick,
  onHighlightChange,
}: DungeonEntranceButtonProps) {
  return (
    <button
      type="button"
      className={`dungeon-entrance-button ${selected ? "is-selected" : ""}`}
      style={{
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height,
      }}
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={() => onHighlightChange(true)}
      onPointerLeave={() => onHighlightChange(false)}
      onFocus={() => onHighlightChange(true)}
      onBlur={() => onHighlightChange(false)}
      aria-label="던전 입구, 층 선택 열기"
    >
      <span className="dungeon-entrance-label" aria-hidden="true">
        &lt;던전 입구&gt;
      </span>
    </button>
  );
}
