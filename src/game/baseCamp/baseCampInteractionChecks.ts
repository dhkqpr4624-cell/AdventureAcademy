import { BASE_CAMP_MAP } from "../../data/baseCampMap";
import { BASE_CAMP_LAYER } from "./baseCampLayers";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[base camp interaction checks] ${message}`);
}

export function runBaseCampInteractionChecks() {
  const entranceRegion = BASE_CAMP_MAP.interactionRegions.find(
    (region) => region.id === "dungeonEntrance",
  );

  assert(Boolean(entranceRegion), "dungeon entrance interaction is missing");
  assert(
    Boolean(BASE_CAMP_MAP.layers.dungeonEntranceButton),
    "dungeon entrance button asset is missing",
  );
  assert(
    BASE_CAMP_LAYER.structures < BASE_CAMP_LAYER.dungeonEntranceButton,
    "button layer must render above the dungeon entrance",
  );
  assert(
    BASE_CAMP_LAYER.dungeonEntranceButton < BASE_CAMP_LAYER.ground,
    "button layer must stay inside the BaseCamp world stack",
  );
  assert(
    BASE_CAMP_MAP.focusPoints.dungeonEntrance.zoom === 1.45,
    "dungeon entrance must use one absolute target zoom",
  );
  assert(
    BASE_CAMP_MAP.layers.dungeonEntranceButton !==
      BASE_CAMP_MAP.layers.dungeonEntrance,
    "button overlay must be independent from the original entrance layer",
  );
}
