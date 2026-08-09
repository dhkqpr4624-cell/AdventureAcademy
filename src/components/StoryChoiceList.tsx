import type { StoryChoiceOption } from "../types/story";

export function StoryChoiceList({ options, disabled, onChoose }: {
  options: StoryChoiceOption[]; disabled: boolean; onChoose: (option: StoryChoiceOption) => void;
}) {
  const hasLongLabel = options.some((option) => option.label.length > 18);
  return (
    <div className={`story-choice-list ${hasLongLabel ? "has-long-label" : ""}`} role="group" aria-label="대화 선택지">
      {options.map((option) => (
        <button key={option.id} type="button" disabled={disabled} onClick={() => onChoose(option)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
