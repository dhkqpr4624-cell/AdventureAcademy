import { BASE_CAMP_MAP } from "./baseCampMap";
import type { BaseCampMapDefinition } from "../types/baseCamp";

export const BASE_CAMP_MAPS: Record<string, BaseCampMapDefinition> = {
  [BASE_CAMP_MAP.id]: BASE_CAMP_MAP,
};

export function getBaseCampMap(mapId: string) {
  return BASE_CAMP_MAPS[mapId];
}
