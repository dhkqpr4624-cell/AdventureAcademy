import { INITIAL_QUEST_STATE, QUEST_DEFINITIONS } from "./questDefinitions";
import { QuestManager } from "./QuestManager";
import { ACHIEVEMENT_DEFINITIONS } from "../../data/achievementDefinitions";
import { getItemDefinition } from "../inventory/itemDefinitions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[quest checks] ${message}`);
}

export function runQuestChecks() {
  const floor1Quest = QUEST_DEFINITIONS.find((quest) => quest.id === "quest-floor-1-prehistory");
  const floor1Achievement = ACHIEVEMENT_DEFINITIONS.find((achievement) => achievement.id === "achievement-floor-1-rare-reward");
  assert(floor1Quest?.rewards.description.includes("주먹도끼"), "floor 1 quest names the hand axe reward");
  assert(floor1Achievement?.rewardItemId === "weapon-hand-axe", "floor 1 achievement grants the hand axe reward");
  assert(getItemDefinition("weapon-hand-axe")?.type === "weaponSkin", "hand axe reward is an inventory weapon skin");
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
