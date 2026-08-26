import { ACHIEVEMENT_DEFINITIONS } from "../data/achievementDefinitions";
import { getQuestFloorUnlockActionId } from "../game/floor/FloorUnlockResolver";
import type { FloorId } from "../game/floor/floorTypes";
import { changeItemQuantity } from "../game/inventory/inventoryState";
import { QUEST_DEFINITIONS } from "../game/quest/questDefinitions";
import { getQuestRareRewardCondition } from "../game/quest/questRareRewardConditions";
import { createInitialGameSaveState, type GameSaveState } from "../save/saveStateAdapter";

const FLOOR_IDS: readonly FloorId[] = ["floor-1", "floor-2", "floor-3", "floor-4", "floor-5", "floor-6", "floor-7", "floor-8", "floor-9", "floor-10"];

export function createDebugFloorJumpState(targetFloor: FloorId, playerName = "DEBUG"): GameSaveState {
  const state = createInitialGameSaveState();
  const targetIndex = FLOOR_IDS.indexOf(targetFloor);
  if (targetIndex < 0) return state;
  let inventoryState = state.inventoryState;
  const completedQuestIds = QUEST_DEFINITIONS.slice(0, targetIndex).map((quest) => quest.id);
  const completedFloorIds = FLOOR_IDS.slice(0, targetIndex);
  const questState = { ...state.questState };
  const rewardClaimed: Record<string, boolean> = {};
  const achievementReceived: Record<string, boolean> = {};
  const firstObjectiveEventSeen: Record<string, boolean> = {};
  const floorBestCorrect: Record<string, number> = {};
  completedQuestIds.forEach((questId, index) => {
    const floorId = completedFloorIds[index];
    const condition = getQuestRareRewardCondition(questId);
    const achievement = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.rewardStateId === questId)!;
    questState[questId] = "completed";
    rewardClaimed[questId] = true;
    achievementReceived[achievement.id] = true;
    firstObjectiveEventSeen[floorId] = true;
    firstObjectiveEventSeen[`reward-revealed:${questId}`] = true;
    floorBestCorrect[floorId] = condition.totalQuestions;
    inventoryState = changeItemQuantity(inventoryState, achievement.rewardItemId, 1);
  });
  const targetQuest = QUEST_DEFINITIONS[targetIndex];
  questState[targetQuest.id] = "available";
  return {
    ...state,
    playerState: { ...state.playerState, name: playerName || "DEBUG", gold: completedQuestIds.length * 5 },
    questState, inventoryState, clearedFloorIds: [...completedFloorIds],
    floorUnlockState: { unlockedFloorIds: [...completedFloorIds] }, floorBestCorrect,
    firstObjectiveEventSeen, rewardClaimed, achievementReceived,
    completedStoryIds: completedQuestIds.flatMap((questId) => {
      const quest = QUEST_DEFINITIONS.find((entry) => entry.id === questId)!;
      return [quest.offerStorySequenceId, quest.acceptStorySequenceId, quest.completeStorySequenceId].filter((id): id is string => Boolean(id));
    }),
    storyActionState: { executedActionIds: completedQuestIds.map((questId, index) => getQuestFloorUnlockActionId(questId, completedFloorIds[index])) },
  };
}
