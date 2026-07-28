import { runPlayerStatusChecks } from "./components/playerStatusChecks";
import { runCriticalChecks } from "./game/combat/criticalChecks";
import { runNormalCombatChecks } from "./game/combat/normalCombatChecks";
import { runPotionChecks } from "./game/combat/potionChecks";
import { runDungeonCameraChecks } from "./game/dungeon/dungeonCameraChecks";
import { runDungeonCompletionChecks } from "./game/dungeon/dungeonCompletionChecks";
import { runDungeonEventFlowChecks } from "./game/dungeon/dungeonEventFlowChecks";
import { runDungeonMapChecks } from "./game/dungeon/dungeonMapChecks";
import { runDungeonPlayerStateChecks } from "./game/dungeon/dungeonPlayerStateChecks";
import { runDungeonQuestionChecks } from "./game/dungeon/dungeonQuestionSets";
import { runDungeonRoomEventChecks } from "./game/dungeon/dungeonRoomEventChecks";
import { TEST_DUNGEON_MAP } from "./game/dungeon/testDungeonMap";
import { runNpcChecks } from "./game/npc/npcChecks";
import { runQuestChecks } from "./game/quest/questChecks";
import { runQuestionGradingChecks } from "./game/question/questionGradingChecks";
import { runStoryPresentationChecks } from "./game/story/storyPresentationChecks";
import { runFloorUnlockChecks } from "./game/floor/floorUnlockChecks";
import { runQuestMarkerChecks } from "./game/quest/questMarkerChecks";
import { runBaseCampInteractionChecks } from "./game/baseCamp/baseCampInteractionChecks";
import { runAutoSaveChecks, runSaveBackupChecks, runSaveChecks, runSaveMigrationChecks } from "./save/saveChecks";
import { runStoryChoiceChecks } from "./game/story/storyChoiceChecks";
import { runEliteCombatChecks } from "./game/combat/eliteCombatChecks";
import { runEliteRoomChecks } from "./game/dungeon/eliteRoomChecks";
import { runPlayerDamageChecks } from "./game/player/playerDamageChecks";
import { runDungeonRunExitChecks } from "./game/dungeon/dungeonRunExitChecks";
import { runDungeonFailureChecks } from "./game/dungeon/dungeonFailureChecks";

const checks = [
  ["npc checks", runNpcChecks],
  ["quest checks", runQuestChecks],
  ["quest marker checks", runQuestMarkerChecks],
  ["floor unlock checks", runFloorUnlockChecks],
  ["base camp interaction checks", runBaseCampInteractionChecks],
  ["player status checks", runPlayerStatusChecks],
  ["story presentation checks", runStoryPresentationChecks],
  ["dungeon map checks", runDungeonMapChecks],
  ["dungeon camera checks", runDungeonCameraChecks],
  ["dungeon question checks", () => runDungeonQuestionChecks(TEST_DUNGEON_MAP)],
  ["dungeon completion checks", runDungeonCompletionChecks],
  ["dungeon room event checks", runDungeonRoomEventChecks],
  ["dungeon event flow checks", runDungeonEventFlowChecks],
  ["dungeon player state checks", runDungeonPlayerStateChecks],
  ["question grading checks", runQuestionGradingChecks],
  ["normal combat checks", runNormalCombatChecks],
  ["critical checks", runCriticalChecks],
  ["potion checks", runPotionChecks],
  ["elite combat checks", runEliteCombatChecks],
  ["elite room checks", runEliteRoomChecks],
  ["player damage checks", runPlayerDamageChecks],
  ["dungeon run exit checks", runDungeonRunExitChecks],
  ["dungeon failure checks", runDungeonFailureChecks],
  ["save checks", runSaveChecks],
  ["save migration checks", runSaveMigrationChecks],
  ["save backup checks", runSaveBackupChecks],
  ["autosave checks", runAutoSaveChecks],
  ["story choice checks", runStoryChoiceChecks],
] as const;

for (const [label, run] of checks) {
  run();
  console.info(`${label}: PASS`);
}
