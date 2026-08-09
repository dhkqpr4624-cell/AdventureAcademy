import type { DungeonMapDefinition } from "../dungeonTypes";
import { FLOOR_DEFINITIONS } from "../../floor/floorDefinitions";
import type { FloorId } from "../../floor/floorTypes";
import { TEST_DUNGEON_MAP } from "../testDungeonMap";
import { generateDungeon } from "./DungeonGenerator";
import {
  FLOOR1_GENERATION_CONFIG,
  FLOOR1_MAP_TEMPLATES,
  FLOOR1_QUESTION_SET_POOL,
} from "./mapTemplates";
import type { DungeonGenerationResult, GeneratedDungeon } from "./dungeonGenerationTypes";

export type Floor1DungeonRun = {
  seed: string;
  map: DungeonMapDefinition;
  generatedDungeon?: GeneratedDungeon;
  generationResult: DungeonGenerationResult;
  source: "generated" | "fallback";
};

let productionSeedCounter = 0;

export function createFloor1RunSeed(): string {
  productionSeedCounter += 1;
  return `floor1-${Date.now()}-${productionSeedCounter}`;
}

export function createFloor1DungeonRun(seed = createFloor1RunSeed()): Floor1DungeonRun {
  return createDungeonRun("floor-1", seed);
}

export function createDungeonRun(
  floorId: FloorId,
  seed = `${floorId}-${Date.now()}-${++productionSeedCounter}`,
): Floor1DungeonRun {
  const floor = FLOOR_DEFINITIONS.find((candidate) => candidate.id === floorId);
  if (!floor) throw new Error(`[dungeonRuntime] Unknown floor: ${floorId}`);
  const config = {
    ...FLOOR1_GENERATION_CONFIG,
    floorId,
    questionCount: floor.questionCount,
    questionBudget: { min: floor.questionCount, max: floor.questionCount },
    maximumRoomCounts: {
      ...FLOOR1_GENERATION_CONFIG.maximumRoomCounts,
      elite: Number.POSITIVE_INFINITY,
    },
  };
  const generationResult = generateDungeon({
    templates: FLOOR1_MAP_TEMPLATES,
    config,
    seed,
    questionSetPool: FLOOR1_QUESTION_SET_POOL,
  });
  if (generationResult.success) {
    return {
      seed,
      map: generationResult.dungeon,
      generatedDungeon: generationResult.dungeon,
      generationResult,
      source: "generated",
    };
  }
  if (import.meta.env.DEV) {
    console.warn("[dungeonRuntime] generation failed; using fixed fallback", {
      seed,
      validationErrors: generationResult.validationErrors,
    });
  }
  return {
    seed,
    map: TEST_DUNGEON_MAP,
    generationResult,
    source: "fallback",
  };
}
