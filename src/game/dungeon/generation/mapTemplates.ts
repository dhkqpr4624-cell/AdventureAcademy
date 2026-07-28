import type {
  DungeonGenerationConfig,
  DungeonQuestionSetPool,
  MapTemplate,
} from "./dungeonGenerationTypes";

export const FLOOR1_GENERATION_CONFIG: DungeonGenerationConfig = {
  floorId: "floor-1",
  minRoomCount: 7,
  maxRoomCount: 8,
  requiredRoomCounts: { start: 1, quest: 1, combat: 1, elite: 1 },
  maximumRoomCounts: { start: 1, quest: 1, treasure: 1, trap: 1, elite: 1 },
  requireTreasureOrTrap: true,
  maxDeadEnds: 4,
  maxNonPurposeDeadEnds: 1,
  maxCycleCount: 1,
  minFinalRoomDistance: 3,
  questionBudget: { min: 6, max: 10 },
  maxGenerationAttempts: 20,
};

export const FLOOR1_QUESTION_SET_POOL: DungeonQuestionSetPool = {
  normalCombat: ["normal-garlic-a", "normal-garlic-b"],
  eliteCombat: ["floor1-elite-a"],
  treasure: ["treasure-test-a"],
  trap: ["trap-test-a"],
};

export const FLOOR1_MAP_TEMPLATES: readonly MapTemplate[] = [
  {
    id: "floor1-branch-a",
    floorId: "floor-1",
    slots: [
      { id: "start", position: { x: 0, y: 0, z: 0 }, allowedRoomTypes: ["start"], fixedRoomType: "start", required: true, tags: ["start"] },
      { id: "junction-a", position: { x: 0, y: 0, z: -16 }, allowedRoomTypes: ["empty", "combat"], required: true },
      { id: "west-a", position: { x: -16, y: 0, z: -16 }, allowedRoomTypes: ["combat", "treasure", "trap"], required: true },
      { id: "east-a", position: { x: 16, y: 0, z: -16 }, allowedRoomTypes: ["combat", "treasure", "trap"], required: true },
      { id: "junction-b", position: { x: 0, y: 0, z: -32 }, allowedRoomTypes: ["empty", "combat"], required: true },
      { id: "west-b", position: { x: -16, y: 0, z: -32 }, allowedRoomTypes: ["elite", "treasure", "trap"], required: true },
      { id: "east-b", position: { x: 16, y: 0, z: -32 }, allowedRoomTypes: ["combat", "treasure", "trap"], required: true },
      { id: "final", position: { x: 0, y: 0, z: -48 }, allowedRoomTypes: ["quest"], fixedRoomType: "quest", required: true, tags: ["finalQuest"] },
    ],
    connectionCandidates: [
      { id: "a-start-j1", fromSlotId: "start", toSlotId: "junction-a", directionFrom: "forward", directionTo: "back", required: true, cameraPathTemplateId: "straight" },
      { id: "a-j1-west", fromSlotId: "junction-a", toSlotId: "west-a", directionFrom: "left", directionTo: "back", required: true, cameraPathTemplateId: "branch-left" },
      { id: "a-j1-east", fromSlotId: "junction-a", toSlotId: "east-a", directionFrom: "right", directionTo: "back", required: true, cameraPathTemplateId: "branch-right" },
      { id: "a-j1-j2", fromSlotId: "junction-a", toSlotId: "junction-b", directionFrom: "forward", directionTo: "back", required: true, cameraPathTemplateId: "straight" },
      { id: "a-j2-west", fromSlotId: "junction-b", toSlotId: "west-b", directionFrom: "left", directionTo: "back", required: true, cameraPathTemplateId: "branch-left" },
      { id: "a-j2-east", fromSlotId: "junction-b", toSlotId: "east-b", directionFrom: "right", directionTo: "back", required: true, cameraPathTemplateId: "branch-right" },
      { id: "a-j2-final", fromSlotId: "junction-b", toSlotId: "final", directionFrom: "forward", directionTo: "back", required: true, cameraPathTemplateId: "straight" },
      { id: "a-east-link", fromSlotId: "east-a", toSlotId: "east-b", directionFrom: "forward", directionTo: "back", optionalWeight: 1, cameraPathTemplateId: "straight" },
    ],
    constraints: { minRoomCount: 8, maxRoomCount: 8, maxDeadEnds: 4, maxCycleCount: 1 },
  },
  {
    id: "floor1-branch-b",
    floorId: "floor-1",
    slots: [
      { id: "start", position: { x: 0, y: 0, z: 0 }, allowedRoomTypes: ["start"], fixedRoomType: "start", required: true, tags: ["start"] },
      { id: "junction-a", position: { x: 0, y: 0, z: -16 }, allowedRoomTypes: ["empty", "combat"], required: true },
      { id: "west-a", position: { x: -16, y: 0, z: -16 }, allowedRoomTypes: ["combat", "treasure", "trap"], required: true },
      { id: "east-a", position: { x: 16, y: 0, z: -16 }, allowedRoomTypes: ["combat", "treasure", "trap"], required: true },
      { id: "east-b", position: { x: 16, y: 0, z: -32 }, allowedRoomTypes: ["empty", "combat"], required: true },
      { id: "center-b", position: { x: 0, y: 0, z: -32 }, allowedRoomTypes: ["elite", "treasure", "trap"], required: true },
      { id: "final", position: { x: 0, y: 0, z: -48 }, allowedRoomTypes: ["quest"], fixedRoomType: "quest", required: true, tags: ["finalQuest"] },
    ],
    connectionCandidates: [
      { id: "b-start-j1", fromSlotId: "start", toSlotId: "junction-a", directionFrom: "forward", directionTo: "back", required: true, cameraPathTemplateId: "straight" },
      { id: "b-j1-west", fromSlotId: "junction-a", toSlotId: "west-a", directionFrom: "left", directionTo: "back", required: true, cameraPathTemplateId: "branch-left" },
      { id: "b-j1-east", fromSlotId: "junction-a", toSlotId: "east-a", directionFrom: "right", directionTo: "back", required: true, cameraPathTemplateId: "branch-right" },
      { id: "b-east-a-b", fromSlotId: "east-a", toSlotId: "east-b", directionFrom: "forward", directionTo: "back", required: true, cameraPathTemplateId: "straight" },
      { id: "b-east-center", fromSlotId: "east-b", toSlotId: "center-b", directionFrom: "left", directionTo: "back", required: true, cameraPathTemplateId: "branch-left" },
      { id: "b-center-final", fromSlotId: "center-b", toSlotId: "final", directionFrom: "forward", directionTo: "back", required: true, cameraPathTemplateId: "straight" },
      { id: "b-j1-center", fromSlotId: "junction-a", toSlotId: "center-b", directionFrom: "forward", directionTo: "back", optionalWeight: 0.35, cameraPathTemplateId: "straight" },
    ],
    constraints: { minRoomCount: 7, maxRoomCount: 7, maxDeadEnds: 3, maxCycleCount: 1 },
  },
];
