import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import { DUNGEON9_CLUE_STORIES, DUNGEON9_FINAL_STORY } from "./data/stories/dungeon9Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { selectRequiredStoryRoomIds } from "./game/dungeon/generation/DungeonGenerator";
import { TEST_DUNGEON_MAP } from "./game/dungeon/testDungeonMap";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { getMonsterVisualDefinition } from "./game/monster/monsterDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { getQuestRareRewardCondition } from "./game/quest/questRareRewardConditions";
import { prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon9 content checks] ${message}`);
}

export function runDungeon9ContentChecks(): void {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-9-goryeo-society-culture");
  assert(quest?.giverNpcId === "luna" && quest.targetFloorId === "floor-9", "floor 9 quest registration");
  assert(FLOOR_DEFINITIONS.some((entry) => entry.id === "floor-9"), "floor 9 definition");
  assert(DUNGEON_FLOOR_TITLES.some((entry) => entry.floorId === "floor-9" && entry.subtitle === "고려시대의 사회와 문화"), "floor 9 title");
  assert(Boolean(NPC_STORY_SEQUENCES[quest.offerStorySequenceId]), "floor 9 offer story");
  assert(Boolean(quest.completeStorySequenceId && NPC_STORY_SEQUENCES[quest.completeStorySequenceId]), "floor 9 completion story");
  assert(DUNGEON9_CLUE_STORIES.length === 3, "exactly three story sequences");
  assert(DUNGEON9_CLUE_STORIES.every((story) => story.scenes[0].steps.some((step) => step.type === "wait" && step.durationMs === 1500)), "clue illustration waits");
  assert(DUNGEON9_FINAL_STORY.scenes[0].steps.some((step) => step.type === "shake" && step.durationMs === 1500 && step.hideDialogue), "altar illustration shake");
  assert(getMonsterVisualDefinition("goryeo-spirit").name === "고려의 영혼", "normal monster");
  assert(getMonsterVisualDefinition("vengeful-goryeo-spirit").name === "한 맺힌 고려의 영혼", "elite monster");
  assert(getItemDefinition("armor-tripitaka-koreana")?.type === "armor", "Tripitaka armor registration");
  assert((getItemDefinition("armor-tripitaka-koreana")?.equipmentStats?.maxHpBonus ?? 0) > 0, "Tripitaka HP bonus");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-9-rare-reward"), "floor 9 achievement");
  assert(getQuestRareRewardCondition(quest.id).floorId === "floor-9", "floor 9 rare reward condition");

  const floorMap = prepareFloorDungeonMap(TEST_DUNGEON_MAP, "floor-9", "dungeon9-check");
  const storyRoomIds = selectRequiredStoryRoomIds(floorMap, 3);
  assert(storyRoomIds.length === 3, "exactly three selected story rooms");
  assert(storyRoomIds.every((roomId) => floorMap.rooms.find((room) => room.id === roomId)?.type === "empty"), "story rooms are non-combat rooms");

  const debug = createDebugFloorJumpState("floor-9");
  assert(debug.questState[quest.id] === "available", "Dungeon9 debug progression");
  assert(debug.questState["quest-floor-8-goryeo-relations"] === "completed", "Dungeon8 completed before Dungeon9 debug jump");
}
