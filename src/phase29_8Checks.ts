import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { allocateDungeonRunQuestions } from "./game/dungeon/dungeonRunQuestionAllocator";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import type { FloorId } from "./game/floor/floorTypes";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { MONSTER_VISUAL_DEFINITIONS } from "./game/monster/monsterDefinitions";
import { NPC_BY_ID } from "./game/npc/npcDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { applyFloorMonsterData, prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[phase29_8Checks] ${message}`);
}

export function runPhase29_8Checks(): void {
  const floorIds: FloorId[] = ["floor-1", "floor-2", "floor-3", "floor-4"];
  for (const floorId of floorIds) {
    const floor = FLOOR_DEFINITIONS.find((entry) => entry.id === floorId);
    assert(floor, `${floorId} definition missing`);
    const run = createDungeonRun(floorId, `phase29-8-${floorId}`);
    assert(run.source === "generated", `${floorId} must use generated map`);
    const map = prepareFloorDungeonMap(run.map, floorId, run.seed);
    const assignments = allocateDungeonRunQuestions(map, run.seed, floorId);
    const assignedCount = Object.values(assignments).reduce((sum, questions) => sum + questions.length, 0);
    assert(assignedCount === floor.questionCount, `${floorId} question count mismatch`);
    assert(new Set(Object.values(assignments).flat().map((question) => question.id)).size === assignedCount, `${floorId} questions must not repeat`);
  }

  const floor3Title = DUNGEON_FLOOR_TITLES.find((entry) => entry.floorId === "floor-3");
  const floor4Title = DUNGEON_FLOOR_TITLES.find((entry) => entry.floorId === "floor-4");
  assert(floor3Title?.subtitle === "삼국의 발전 : 고구려와 백제", "floor 3 title mismatch");
  assert(floor4Title?.subtitle === "삼국의 발전 : 신라와 가야", "floor 4 title mismatch");

  const floor3Run = createDungeonRun("floor-3", "phase29-8-floor3-monsters");
  const floor3Map = applyFloorMonsterData(prepareFloorDungeonMap(floor3Run.map, "floor-3", floor3Run.seed), floor3Run.seed, "floor-3");
  const normalMonsterIds = floor3Map.rooms.filter((room) => room.type === "combat").map((room) => room.combatConfig?.monsterId);
  const eliteMonsterIds = floor3Map.rooms.filter((room) => room.type === "elite").map((room) => room.eliteConfig?.monsterId);
  assert(normalMonsterIds.every((id) => id === "baekje-smile" || id === "goguryeo-samjogo"), "floor 3 normal monster roster mismatch");
  assert(eliteMonsterIds.every((id) => id === "twisted-pensive-bodhisattva"), "floor 3 elite monster mismatch");
  assert(Boolean(MONSTER_VISUAL_DEFINITIONS["baekje-smile"]), "Baekje monster missing");
  assert(Boolean(MONSTER_VISUAL_DEFINITIONS["goguryeo-samjogo"]), "Goguryeo monster missing");
  assert(Boolean(MONSTER_VISUAL_DEFINITIONS["twisted-pensive-bodhisattva"]), "elite monster missing");

  const floor4Run = createDungeonRun("floor-4", "phase29-8-floor4-story");
  const floor4Map = prepareFloorDungeonMap(floor4Run.map, "floor-4", floor4Run.seed);
  assert(!floor4Map.rooms.some((room) => room.id.startsWith("room-story-")), "floor 4 must not contain story rooms");
  assert(Boolean(floor4Run.generatedDungeon?.finalQuestRoomId), "floor 4 final quest room missing");

  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-4-jeon-rescue");
  assert(quest?.giverNpcId === "luna" && quest.targetFloorId === "floor-4", "floor 4 quest linkage mismatch");
  assert(Boolean(NPC_STORY_SEQUENCES["npc-luna-floor-4-quest-available"]), "floor 4 offer story missing");
  assert(Boolean(NPC_STORY_SEQUENCES["npc-luna-floor-4-quest-complete"]), "floor 4 completion story missing");
  assert(NPC_BY_ID.jeon.dialogue.defaultStorySequenceId === "npc-jeon-default", "Jeon idle story missing");
  assert(getItemDefinition("weapon-chiljido")?.type === "weaponSkin", "Chiljido reward missing");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.rewardItemId === "weapon-chiljido"), "floor 4 achievement reward missing");
}
