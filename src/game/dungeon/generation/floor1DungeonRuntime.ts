import type { DungeonMapDefinition } from "../dungeonTypes";
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
  const generationResult = generateDungeon({
    templates: FLOOR1_MAP_TEMPLATES,
    config: FLOOR1_GENERATION_CONFIG,
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
    console.warn("[floor1DungeonRuntime] generation failed; using fixed fallback", {
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
