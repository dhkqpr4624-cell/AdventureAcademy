import { useEffect, useState } from "react";
import type { ScreenId } from "../../app/routes";
import type { IntroSceneSequence } from "../../types/story";
import { IntroTextPlayer } from "./IntroTextPlayer";
import { StoryPlayer } from "./StoryPlayer";
import { playBgm } from "../audioBgm";

export function IntroScenePlayer({
  sequence, playerName, onNavigate, onStarted, onCheckpoint, onCompleted,
}: {
  sequence: IntroSceneSequence;
  playerName: string;
  onNavigate: (screen: ScreenId) => void;
  onStarted?: (storyId: string) => void;
  onCheckpoint?: (storyId: string, checkpointId: string) => void;
  onCompleted?: (storyId: string) => void;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = sequence.scenes[sceneIndex];

  useEffect(() => {
    if (sceneIndex < 2) playBgm("airship", undefined, { loop: true, volume: 0.52 });
    else playBgm("intro-story", undefined, { loop: true, volume: 0.52 });
  }, [sceneIndex]);
  const finishScene = () => {
    if (sceneIndex + 1 < sequence.scenes.length) setSceneIndex((current) => current + 1);
    else {
      onCompleted?.(sequence.id);
      onNavigate(sequence.onCompleteScreen);
    }
  };

  if (!scene) return null;
  if (scene.mode === "introText") {
    return <IntroTextPlayer key={scene.id} lines={scene.lines} onComplete={finishScene} />;
  }
  return (
    <StoryPlayer
      key={scene.id}
      sequence={scene.sequence}
      playerName={playerName}
      onNavigate={onNavigate}
      onComplete={finishScene}
      onStoryStarted={onStarted}
      onCheckpointReached={onCheckpoint}
    />
  );
}
