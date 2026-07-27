import { QUEST_DEFINITIONS } from "./questDefinitions";
import type {
  AcceptQuestResult,
  QuestDefinition,
  QuestState,
  QuestStatus,
} from "./questTypes";

const byId = Object.fromEntries(
  QUEST_DEFINITIONS.map((quest) => [quest.id, quest]),
) as Record<string, QuestDefinition>;

export const QuestManager = {
  getQuestStatus(state: QuestState, questId: string): QuestStatus | undefined {
    return state[questId];
  },
  getActiveQuest(state: QuestState): QuestDefinition | undefined {
    const activeId = Object.keys(state).find((id) => state[id] === "active");
    return activeId ? byId[activeId] : undefined;
  },
  acceptQuest(state: QuestState, questId: string): AcceptQuestResult {
    const quest = byId[questId];
    if (!quest) return { success: false, nextState: state, reason: "questNotFound" };
    if (state[questId] === "active") {
      return { success: false, nextState: state, reason: "alreadyActive" };
    }
    if (state[questId] !== "available" || this.getActiveQuest(state)) {
      return { success: false, nextState: state, reason: "questNotAvailable" };
    }
    return {
      success: true,
      nextState: { ...state, [questId]: "active" },
    };
  },
};

