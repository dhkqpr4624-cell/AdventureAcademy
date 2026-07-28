import { QUEST_DEFINITIONS } from "../game/quest/questDefinitions";
import type { QuestStatus } from "../game/quest/questTypes";
import { CURRENT_SAVE_VERSION, type CurrentSaveData } from "./saveTypes";

const STATUSES = new Set<QuestStatus>(["locked", "available", "active", "completed"]);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const unique = (items: string[]) => [...new Set(items)];

export function validateCurrentSave(value: unknown): CurrentSaveData | null {
  if (!isObject(value) || value.version !== CURRENT_SAVE_VERSION ||
      typeof value.savedAt !== "string" || !Number.isFinite(value.playTimeSeconds) ||
      !isObject(value.player) || !isObject(value.quests) || !isObject(value.floors) ||
      !isObject(value.story) || !isObject(value.dungeon) || !isObject(value.inventory)) return null;
  const player = value.player;
  if (!Number.isFinite(player.level) || !Number.isFinite(player.currentHp) ||
      !Number.isFinite(player.maxHp) || (player.maxHp as number) <= 0 ||
      (player.currentHp as number) < 0 || (player.currentHp as number) > (player.maxHp as number)) return null;
  if (!isObject(value.quests.statuses) || !strings(value.floors.unlockedFloorIds) ||
      !strings(value.story.completedStoryIds) || !isObject(value.story.checkpointByStoryId) ||
      !strings(value.story.executedActionIds) || !strings(value.dungeon.clearedFloorIds)) return null;
  const statuses: Record<string, QuestStatus> = {};
  for (const quest of QUEST_DEFINITIONS) {
    const status = value.quests.statuses[quest.id];
    if (!STATUSES.has(status as QuestStatus)) return null;
    statuses[quest.id] = status as QuestStatus;
  }
  const activeQuestId = value.quests.activeQuestId;
  if (activeQuestId !== null && typeof activeQuestId !== "string") return null;
  const checkpointByStoryId: Record<string, string> = {};
  for (const [id, checkpoint] of Object.entries(value.story.checkpointByStoryId)) {
    if (typeof checkpoint !== "string") return null;
    checkpointByStoryId[id] = checkpoint;
  }
  return {
    version: 1,
    savedAt: value.savedAt,
    playTimeSeconds: Math.max(0, Math.floor(value.playTimeSeconds as number)),
    player: { level: player.level as number, currentHp: player.currentHp as number, maxHp: player.maxHp as number },
    quests: { statuses, activeQuestId: activeQuestId as string | null },
    floors: { unlockedFloorIds: unique(value.floors.unlockedFloorIds as string[]) },
    story: {
      completedStoryIds: unique(value.story.completedStoryIds as string[]),
      checkpointByStoryId,
      executedActionIds: unique(value.story.executedActionIds as string[]),
    },
    dungeon: {
      currentFloorId: value.dungeon.currentFloorId === null || typeof value.dungeon.currentFloorId === "string" ? value.dungeon.currentFloorId as string | null : null,
      clearedFloorIds: unique(value.dungeon.clearedFloorIds as string[]),
    },
    inventory: { items: {}, equippedItemIds: {} },
  };
}

