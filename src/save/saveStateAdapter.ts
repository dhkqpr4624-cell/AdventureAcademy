import { INITIAL_FLOOR_UNLOCK_STATE } from "../game/floor/floorDefinitions";
import type { FloorUnlockState } from "../game/floor/floorTypes";
import { INITIAL_PLAYER_STATE, type PlayerState } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import type { QuestState } from "../game/quest/questTypes";
import { INITIAL_STORY_ACTION_STATE, type StoryActionState } from "../game/story/storyActionTypes";
import { CURRENT_SAVE_VERSION, type CurrentSaveData } from "./saveTypes";
import { calculatePlayerMaxHp, INITIAL_INVENTORY_STATE, type InventoryState } from "../game/inventory/inventoryState";

export type GameSaveState = {
  playerState: PlayerState; questState: QuestState; floorUnlockState: FloorUnlockState;
  storyActionState: StoryActionState; playTimeSeconds: number;
  completedStoryIds: string[]; checkpointByStoryId: Record<string, string>;
  currentFloorId: string | null; clearedFloorIds: string[];
  inventoryState: InventoryState;
  floorBestCorrect: Record<string, number>;
  firstObjectiveEventSeen: Record<string, boolean>;
  rewardClaimed: Record<string, boolean>;
};
export const createInitialGameSaveState = (): GameSaveState => ({
  playerState: { ...INITIAL_PLAYER_STATE }, questState: { ...INITIAL_QUEST_STATE },
  floorUnlockState: { ...INITIAL_FLOOR_UNLOCK_STATE, unlockedFloorIds: [] },
  storyActionState: { ...INITIAL_STORY_ACTION_STATE, executedActionIds: [] },
  playTimeSeconds: 0, completedStoryIds: [], checkpointByStoryId: {},
  currentFloorId: null, clearedFloorIds: [],
  floorBestCorrect: {}, firstObjectiveEventSeen: {}, rewardClaimed: {},
  inventoryState: {
    items: { ...INITIAL_INVENTORY_STATE.items },
    equippedItemIds: { ...INITIAL_INVENTORY_STATE.equippedItemIds },
  },
});
export function createSaveDataFromGameState(state: GameSaveState): CurrentSaveData {
  const activeQuestId = Object.entries(state.questState).find(([, value]) => value === "active")?.[0] ?? null;
  const maxHp = calculatePlayerMaxHp(state.inventoryState);
  return {
    version: CURRENT_SAVE_VERSION, savedAt: new Date().toISOString(),
    playTimeSeconds: state.playTimeSeconds, player: {
      ...state.playerState,
      name: state.playerState.name ?? "",
      maxHp,
      currentHp: Math.min(state.playerState.currentHp, maxHp),
    },
    quests: { statuses: { ...state.questState }, activeQuestId },
    floors: { unlockedFloorIds: [...state.floorUnlockState.unlockedFloorIds] },
    story: { completedStoryIds: [...state.completedStoryIds], checkpointByStoryId: { ...state.checkpointByStoryId }, executedActionIds: [...state.storyActionState.executedActionIds] },
    dungeon: { currentFloorId: state.currentFloorId, clearedFloorIds: [...state.clearedFloorIds] },
    inventory: {
      items: { ...state.inventoryState.items },
      equippedItemIds: { ...state.inventoryState.equippedItemIds },
    },
    questProgress: {
      floorBestCorrect: { ...state.floorBestCorrect },
      firstObjectiveEventSeen: { ...state.firstObjectiveEventSeen },
      rewardClaimed: { ...state.rewardClaimed },
    },
  };
}
export function applySaveDataToGameState(data: CurrentSaveData): GameSaveState {
  const inventoryState: InventoryState = {
    items: { ...data.inventory.items },
    equippedItemIds: {
      weaponSkin: data.inventory.equippedItemIds.weaponSkin ?? null,
      armor: data.inventory.equippedItemIds.armor ?? null,
    },
  };
  return {
    playerState: {
      ...data.player,
      maxHp: calculatePlayerMaxHp(inventoryState),
      currentHp: Math.min(data.player.currentHp, calculatePlayerMaxHp(inventoryState)),
    }, questState: { ...data.quests.statuses },
    floorUnlockState: { unlockedFloorIds: [...data.floors.unlockedFloorIds] as FloorUnlockState["unlockedFloorIds"] },
    storyActionState: { executedActionIds: [...data.story.executedActionIds] },
    playTimeSeconds: data.playTimeSeconds, completedStoryIds: [...data.story.completedStoryIds],
    checkpointByStoryId: { ...data.story.checkpointByStoryId },
    currentFloorId: data.dungeon.currentFloorId, clearedFloorIds: [...data.dungeon.clearedFloorIds],
    inventoryState,
    floorBestCorrect: { ...data.questProgress.floorBestCorrect },
    firstObjectiveEventSeen: { ...data.questProgress.firstObjectiveEventSeen },
    rewardClaimed: { ...data.questProgress.rewardClaimed },
  };
}
