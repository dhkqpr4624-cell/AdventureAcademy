import { useState } from "react";
import { BaseCampScreen } from "../screens/BaseCampScreen/BaseCampScreen";
import { DungeonScreen } from "../screens/DungeonScreen/DungeonScreen";
import { StoryScreen } from "../screens/StoryScreen/StoryScreen";
import { TitleScreen } from "../screens/TitleScreen/TitleScreen";
import type { ScreenId } from "./routes";

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("title");

  switch (currentScreen) {
    case "story":
      return <StoryScreen onNavigate={setCurrentScreen} />;
    case "baseCamp":
      return <BaseCampScreen onNavigate={setCurrentScreen} />;
    case "dungeon":
      return <DungeonScreen onNavigate={setCurrentScreen} />;
    case "title":
    default:
      return <TitleScreen onNavigate={setCurrentScreen} />;
  }
}
