import { useEffect, useState } from "react";
import { BaseCampScreen } from "../screens/BaseCampScreen/BaseCampScreen";
import { DungeonScreen } from "../screens/DungeonScreen/DungeonScreen";
import { StoryScreen } from "../screens/StoryScreen/StoryScreen";
import { TitleScreen } from "../screens/TitleScreen/TitleScreen";
import { QuestionScreen } from "../screens/QuestionScreen/QuestionScreen";
import type { QuestionResult } from "../types/question";
import type { ScreenId } from "./routes";
import {
  INITIAL_PLAYER_STATE,
  type PlayerState,
} from "../game/player/playerState";
import {
  INITIAL_QUEST_STATE,
} from "../game/quest/questDefinitions";
import type { QuestState } from "../game/quest/questTypes";
import { runNpcChecks } from "../game/npc/npcChecks";
import { runQuestChecks } from "../game/quest/questChecks";
import { runPlayerStatusChecks } from "../components/playerStatusChecks";
import {
  INITIAL_FLOOR_UNLOCK_STATE,
} from "../game/floor/floorDefinitions";
import type { FloorUnlockState } from "../game/floor/floorTypes";
import { runFloorUnlockChecks } from "../game/floor/floorUnlockChecks";
import {
  INITIAL_STORY_ACTION_STATE,
  type StoryActionState,
} from "../game/story/storyActionTypes";
import { runQuestMarkerChecks } from "../game/quest/questMarkerChecks";
import { runBaseCampInteractionChecks } from "../game/baseCamp/baseCampInteractionChecks";

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("title");
  const [, setQuestionResults] = useState<QuestionResult[]>([]);
  const [playerState, setPlayerState] =
    useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [questState, setQuestState] =
    useState<QuestState>(INITIAL_QUEST_STATE);
  const [floorUnlockState, setFloorUnlockState] =
    useState<FloorUnlockState>(INITIAL_FLOOR_UNLOCK_STATE);
  const [storyActionState, setStoryActionState] =
    useState<StoryActionState>(INITIAL_STORY_ACTION_STATE);

  useEffect(() => {
    if (import.meta.env.DEV) {
      runNpcChecks();
      runQuestChecks();
      runPlayerStatusChecks();
      runFloorUnlockChecks();
      runQuestMarkerChecks();
      runBaseCampInteractionChecks();
      console.info("npc checks: PASS");
      console.info("quest checks: PASS");
      console.info("player status checks: PASS");
      console.info("floor unlock checks: PASS");
      console.info("quest marker checks: PASS");
      console.info("base camp interaction checks: PASS");
    }
  }, []);

  switch (currentScreen) {
    case "story":
      return <StoryScreen onNavigate={setCurrentScreen} />;
    case "baseCamp":
      return (
        <BaseCampScreen
          onNavigate={setCurrentScreen}
          playerState={playerState}
          questState={questState}
          setQuestState={setQuestState}
          floorUnlockState={floorUnlockState}
          setFloorUnlockState={setFloorUnlockState}
          storyActionState={storyActionState}
          setStoryActionState={setStoryActionState}
        />
      );
    case "dungeon":
      return (
        <DungeonScreen
          onNavigate={setCurrentScreen}
          playerState={playerState}
          setPlayerState={setPlayerState}
        />
      );
    case "question":
      return (
        <QuestionScreen
          onNavigate={setCurrentScreen}
          onResult={(result) => {
            setQuestionResults((current) => [...current, result]);
          }}
        />
      );
    case "title":
    default:
      return <TitleScreen onNavigate={setCurrentScreen} />;
  }
}
