import { QUEST_DEFINITIONS } from "../quest/questDefinitions";
import type { StoryActionState } from "../story/storyActionTypes";
import { FloorUnlockManager } from "./FloorUnlockManager";
import type { FloorId, FloorUnlockState } from "./floorTypes";

type ResolveQuestFloorUnlockOptions = {
  questId: string;
  floorState: FloorUnlockState;
  actionState: StoryActionState;
  save: () => void;
};

export type QuestFloorUnlockResult = {
  nextFloorState: FloorUnlockState;
  nextActionState: StoryActionState;
  changed: boolean;
};

export function getQuestFloorUnlockActionId(
  questId: string,
  floorId: FloorId,
) {
  return `quest:${questId}:unlock:${floorId}`;
}

export function resolveQuestFloorUnlock({
  questId,
  floorState,
  actionState,
  save,
}: ResolveQuestFloorUnlockOptions): QuestFloorUnlockResult {
  const quest = QUEST_DEFINITIONS.find((candidate) => candidate.id === questId);
  if (!quest?.targetFloorId) {
    return {
      nextFloorState: floorState,
      nextActionState: actionState,
      changed: false,
    };
  }

  const actionId = getQuestFloorUnlockActionId(
    quest.id,
    quest.targetFloorId,
  );
  if (actionState.executedActionIds.includes(actionId)) {
    return {
      nextFloorState: floorState,
      nextActionState: actionState,
      changed: false,
    };
  }

  const unlockResult = FloorUnlockManager.unlockFloor(
    floorState,
    quest.targetFloorId,
  );
  if (!unlockResult.success) {
    return {
      nextFloorState: floorState,
      nextActionState: actionState,
      changed: false,
    };
  }

  const nextActionState = {
    ...actionState,
    executedActionIds: [...actionState.executedActionIds, actionId],
  };
  if (unlockResult.changed) save();

  return {
    nextFloorState: unlockResult.nextState,
    nextActionState,
    changed: unlockResult.changed,
  };
}
