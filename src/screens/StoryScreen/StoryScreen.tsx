import type { ScreenId } from "../../app/routes";
import { INTRO_SCENE_SEQUENCE } from "../../data/stories/introScenes";
import { IntroScenePlayer } from "../../game/story/IntroScenePlayer";

type StoryScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  onStoryStarted: (storyId: string) => void;
  onStoryCompleted: (storyId: string) => void;
  onStoryCheckpoint?: (storyId: string, checkpointId: string) => void;
  playerName: string;
};

export function StoryScreen({
  onNavigate, onStoryStarted, onStoryCompleted, onStoryCheckpoint, playerName,
}: StoryScreenProps) {
  return (
    <IntroScenePlayer
      sequence={INTRO_SCENE_SEQUENCE}
      playerName={playerName}
      onNavigate={onNavigate}
      onStarted={onStoryStarted}
      onCompleted={onStoryCompleted}
      onCheckpoint={onStoryCheckpoint}
    />
  );
}
