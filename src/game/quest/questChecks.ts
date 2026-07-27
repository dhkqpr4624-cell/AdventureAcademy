import { INITIAL_QUEST_STATE, QUEST_DEFINITIONS } from "./questDefinitions";
import { QuestManager } from "./QuestManager";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[quest checks] ${message}`);
}

export function runQuestChecks() {
  assert(
    new Set(QUEST_DEFINITIONS.map((quest) => quest.id)).size ===
      QUEST_DEFINITIONS.length,
    "duplicate quest id",
  );
  const questId = QUEST_DEFINITIONS[0].id;
  const accepted = QuestManager.acceptQuest(INITIAL_QUEST_STATE, questId);
  assert(accepted.success, "available quest was not accepted");
  assert(accepted.nextState[questId] === "active", "quest did not become active");
  assert(
    QuestManager.getActiveQuest(accepted.nextState)?.id === questId,
    "active quest lookup failed",
  );
  assert(
    QuestManager.acceptQuest(accepted.nextState, questId).reason ===
      "alreadyActive",
    "active quest was accepted twice",
  );
  assert(
    QuestManager.acceptQuest(INITIAL_QUEST_STATE, "missing").reason ===
      "questNotFound",
    "missing quest was accepted",
  );
}

