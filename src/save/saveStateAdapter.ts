import { INITIAL_FLOOR_UNLOCK_STATE } from "../game/floor/floorDefinitions";
import type { FloorUnlockState } from "../game/floor/floorTypes";
import { INITIAL_PLAYER_STATE, type PlayerState } from "../game/player/playerState";
import { INITIAL_QUEST_STATE } from "../game/quest/questDefinitions";
import type { QuestState } from "../game/quest/questTypes";
import { INITIAL_STORY_ACTION_STATE, type StoryActionState } from "../game/story/storyActionTypes";
import { CURRENT_SAVE_VERSION, type CurrentSaveData } from "./saveTypes";
import { calculatePlayerMaxHp, INITIAL_INVENTORY_STATE, type InventoryState } from "../game/inventory/inventoryState";
import type { DungeonFloorRunState } from "../game/dungeon/dungeonTypes";
import { ACHIEVEMENT_DEFINITIONS } from "../data/achievementDefinitions";

export type GameSaveState = {
  playerState: PlayerState; questState: QuestState; floorUnlockState: FloorUnlockState;
  storyActionState: StoryActionState; playTimeSeconds: number;
  completedStoryIds: string[]; checkpointByStoryId: Record<string, string>;
  currentFloorId: string | null; clearedFloorIds: string[];
  inventoryState: InventoryState;
  floorBestCorrect: Record<string, number>;
  firstObjectiveEventSeen: Record<string, boolean>;
  rewardClaimed: Record<string, boolean>;
  achievementReceived: Record<string, boolean>;
  currentFloorRun: DungeonFloorRunState | null;
};
export const createInitialGameSaveState = (): GameSaveState => ({
  playerState: { ...INITIAL_PLAYER_STATE }, questState: { ...INITIAL_QUEST_STATE },
  floorUnlockState: { ...INITIAL_FLOOR_UNLOCK_STATE, unlockedFloorIds: [] },
  storyActionState: { ...INITIAL_STORY_ACTION_STATE, executedActionIds: [] },
  playTimeSeconds: 0, completedStoryIds: [], checkpointByStoryId: {},
  currentFloorId: null, clearedFloorIds: [],
  floorBestCorrect: {}, firstObjectiveEventSeen: {}, rewardClaimed: {}, achievementReceived: {},
  currentFloorRun: null,
  inventoryState: {
    items: { ...INITIAL_INVENTORY_STATE.items },
    equippedItemIds: { ...INITIAL_INVENTORY_STATE.equippedItemIds },
  },
});

export function recoverRewardRevealState(data: CurrentSaveData): Record<string, boolean> {
  const recovered = { ...data.questProgress.firstObjectiveEventSeen };

  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    const revealKey = `reward-revealed:${achievement.rewardStateId}`;
    const alreadyRevealed = Boolean(recovered[revealKey]);
    const questCompleted = data.quests.statuses[achievement.rewardStateId] === "completed";
    const rewardClaimed = Boolean(data.questProgress.rewardClaimed[achievement.rewardStateId]);
    const achievementReceived = Boolean(data.questProgress.achievementReceived[achievement.id]);
    const rewardOwned = (data.inventory.items[achievement.rewardItemId] ?? 0) > 0;

    if (alreadyRevealed || questCompleted || rewardClaimed || achievementReceived || rewardOwned) {
      recovered[revealKey] = true;
    }
  }

  return recovered;
}

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
    dungeon: {
      currentFloorId: state.currentFloorId,
      clearedFloorIds: [...state.clearedFloorIds],
      currentFloorRun: state.currentFloorRun
        ? {
            ...state.currentFloorRun,
            roomProgress: Object.fromEntries(
              Object.entries(state.currentFloorRun.roomProgress).map(
                ([id, progress]) => [id, { ...progress }],
              ),
            ),
          }
        : null,
    },
    inventory: {
      items: { ...state.inventoryState.items },
      equippedItemIds: { ...state.inventoryState.equippedItemIds },
    },
    questProgress: {
      floorBestCorrect: { ...state.floorBestCorrect },
      firstObjectiveEventSeen: { ...state.firstObjectiveEventSeen },
      rewardClaimed: { ...state.rewardClaimed },
      achievementReceived: { ...state.achievementReceived },
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
    currentFloorRun: data.dungeon.currentFloorRun
      ? {
          ...data.dungeon.currentFloorRun,
          roomProgress: Object.fromEntries(
            Object.entries(data.dungeon.currentFloorRun.roomProgress).map(
              ([id, progress]) => [id, { ...progress }],
            ),
          ),
        }
      : null,
    inventoryState,
    floorBestCorrect: { ...data.questProgress.floorBestCorrect },
    firstObjectiveEventSeen: recoverRewardRevealState(data),
    rewardClaimed: { ...data.questProgress.rewardClaimed },
    achievementReceived: { ...data.questProgress.achievementReceived },
  };
}
