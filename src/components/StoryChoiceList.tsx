import type { StoryChoiceOption } from "../types/story";

export function StoryChoiceList({ options, disabled, onChoose }: {
  options: StoryChoiceOption[]; disabled: boolean; onChoose: (option: StoryChoiceOption) => void;
}) {
  return (
    <div className="story-choice-list" role="group" aria-label="대화 선택지">
      {options.map((option) => (
        <button key={option.id} type="button" disabled={disabled} onClick={() => onChoose(option)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
