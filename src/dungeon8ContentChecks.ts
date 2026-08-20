import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import { DUNGEON8_FINAL_STORY } from "./data/stories/dungeon8Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { TEST_DUNGEON_MAP } from "./game/dungeon/testDungeonMap";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { getMonsterVisualDefinition } from "./game/monster/monsterDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";
import { getSwordDefinitionForEquippedItem } from "./three/weapon/SwordViewModel";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon8 content checks] ${message}`);
}

export function runDungeon8ContentChecks(): void {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-8-goryeo-relations");
  assert(quest?.giverNpcId === "kaiden" && quest.targetFloorId === "floor-8", "floor 8 quest registration");
  assert(FLOOR_DEFINITIONS.some((entry) => entry.id === "floor-8"), "floor 8 definition");
  assert(DUNGEON_FLOOR_TITLES.some((entry) => entry.floorId === "floor-8" && entry.subtitle === "고려와 주변 국가의 관계"), "floor 8 title");
  assert(Boolean(NPC_STORY_SEQUENCES[quest.offerStorySequenceId]), "floor 8 offer story");
  assert(Boolean(quest.completeStorySequenceId && NPC_STORY_SEQUENCES[quest.completeStorySequenceId]), "floor 8 completion story");
  assert(DUNGEON8_FINAL_STORY.scenes[0].steps.filter((step) => step.type === "choice").length >= 7, "floor 8 choices and retry choices");
  assert(getMonsterVisualDefinition("khitan-soldier-spirit").name === "거란 병사의 원혼", "Khitan monster");
  assert(getMonsterVisualDefinition("jurchen-soldier-spirit").name === "여진족 병사의 원혼", "Jurchen monster");
  assert(getMonsterVisualDefinition("mongol-general-armor").name === "몽골 장군의 갑주", "Mongol elite monster");
  assert(getItemDefinition("weapon-choe-museon-cannon")?.type === "weaponSkin", "cannon equipment registration");
  assert(getSwordDefinitionForEquippedItem("weapon-choe-museon-cannon").id === "choe-museon-cannon", "cannon view model registration");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-8-rare-reward"), "floor 8 achievement");
  const floorMap = prepareFloorDungeonMap(TEST_DUNGEON_MAP, "floor-8", "dungeon8-check");
  assert(floorMap.rooms.every((room) => !room.id.startsWith("room-story-")), "floor 8 has no story event rooms");
  const debug = createDebugFloorJumpState("floor-8");
  assert(debug.questState["quest-floor-8-goryeo-relations"] === "available", "Dungeon8 debug progression");
}
