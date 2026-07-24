import type { ScreenId } from "../../app/routes";
import { TEST_STORY_SEQUENCE } from "../../data/stories/testStory";
import { StoryPlayer } from "../../game/story/StoryPlayer";

type StoryScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function StoryScreen({ onNavigate }: StoryScreenProps) {
  return <StoryPlayer sequence={TEST_STORY_SEQUENCE} onNavigate={onNavigate} />;
}
