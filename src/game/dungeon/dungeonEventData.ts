export type DungeonReward = {
  id: string;
  message: string;
};

export const DUNGEON_REWARDS: Readonly<Record<string, DungeonReward>> = {
  "old-key": {
    id: "old-key",
    message: "낡은 열쇠를 획득했다.",
  },
};

export function getDungeonReward(rewardId: string): DungeonReward {
  const reward = DUNGEON_REWARDS[rewardId];
  if (!reward) {
    throw new Error(`[dungeonEventData] Unknown reward: ${rewardId}`);
  }
  return reward;
}
