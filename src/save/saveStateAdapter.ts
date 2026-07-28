import { INITIAL_FLOOR_UNLOCK_STATE } from "../game/floor/floorDefinitions";
import type { FloorUnlockState } from "../game/floor/floorTypes";
import { INITIAL_PLAYER_STATE, type PlayerState } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import type { QuestState } from "../game/quest/questTypes";
import { INITIAL_STORY_ACTION_STATE, type StoryActionState } from "../game/story/storyActionTypes";
import { CURRENT_SAVE_VERSION, type CurrentSaveData } from "./saveTypes";

export type GameSaveState = {
  playerState: PlayerState; questState: QuestState; floorUnlockState: FloorUnlockState;
  storyActionState: StoryActionState; playTimeSeconds: number;
  completedStoryIds: string[]; checkpointByStoryId: Record<string, string>;
  currentFloorId: string | null; clearedFloorIds: string[];
};
export const createInitialGameSaveState = (): GameSaveState => ({
  playerState: { ...INITIAL_PLAYER_STATE }, questState: { ...INITIAL_QUEST_STATE },
  floorUnlockState: { ...INITIAL_FLOOR_UNLOCK_STATE, unlockedFloorIds: [] },
  storyActionState: { ...INITIAL_STORY_ACTION_STATE, executedActionIds: [] },
  playTimeSeconds: 0, completedStoryIds: [], checkpointByStoryId: {},
  currentFloorId: null, clearedFloorIds: [],
});
export function createSaveDataFromGameState(state: GameSaveState): CurrentSaveData {
  const activeQuestId = Object.entries(state.questState).find(([, value]) => value === "active")?.[0] ?? null;
  return {
    version: CURRENT_SAVE_VERSION, savedAt: new Date().toISOString(),
    playTimeSeconds: state.playTimeSeconds, player: { ...state.playerState },
    quests: { statuses: { ...state.questState }, activeQuestId },
    floors: { unlockedFloorIds: [...state.floorUnlockState.unlockedFloorIds] },
    story: { completedStoryIds: [...state.completedStoryIds], checkpointByStoryId: { ...state.checkpointByStoryId }, executedActionIds: [...state.storyActionState.executedActionIds] },
    dungeon: { currentFloorId: state.currentFloorId, clearedFloorIds: [...state.clearedFloorIds] },
    inventory: { items: {}, equippedItemIds: {} },
  };
}
export function applySaveDataToGameState(data: CurrentSaveData): GameSaveState {
  return {
    playerState: { ...data.player }, questState: { ...data.quests.statuses },
    floorUnlockState: { unlockedFloorIds: [...data.floors.unlockedFloorIds] as FloorUnlockState["unlockedFloorIds"] },
    storyActionState: { executedActionIds: [...data.story.executedActionIds] },
    playTimeSeconds: data.playTimeSeconds, completedStoryIds: [...data.story.completedStoryIds],
    checkpointByStoryId: { ...data.story.checkpointByStoryId },
    currentFloorId: data.dungeon.currentFloorId, clearedFloorIds: [...data.dungeon.clearedFloorIds],
  };
}

