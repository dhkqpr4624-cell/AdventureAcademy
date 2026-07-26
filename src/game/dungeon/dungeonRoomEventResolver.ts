import type {
  DungeonRoomNode,
  DungeonRoomProgress,
} from "./dungeonTypes";
import { getDungeonReward } from "./dungeonEventData";

export type DungeonRoomEventResolution = {
  eventResult: NonNullable<DungeonRoomProgress["eventResult"]>;
  message: string;
  damage: number;
};

export function resolveDungeonRoomEvent(
  room: DungeonRoomNode,
  isCorrect: boolean,
): DungeonRoomEventResolution {
  if (room.type === "treasure") {
    if (!room.eventConfig || !("rewardId" in room.eventConfig)) {
      throw new Error(`[dungeonRoomEventResolver] ${room.id} needs treasure config`);
    }
    return isCorrect
      ? {
          eventResult: "treasureOpened",
          message: getDungeonReward(room.eventConfig.rewardId).message,
          damage: 0,
        }
      : {
          eventResult: "treasureLocked",
          message: "상자가 잠겨버렸다.",
          damage: 0,
        };
  }
  if (room.type === "trap") {
    if (!room.eventConfig || !("damage" in room.eventConfig)) {
      throw new Error(`[dungeonRoomEventResolver] ${room.id} needs trap config`);
    }
    return isCorrect
      ? {
          eventResult: "trapAvoided",
          message: "간신히 함정을 피했다.",
          damage: 0,
        }
      : {
          eventResult: "trapTriggered",
          message: `함정이 작동했다. ${room.eventConfig.damage}의 피해를 입었다.`,
          damage: room.eventConfig.damage,
        };
  }
  throw new Error(
    `[dungeonRoomEventResolver] ${room.id} is not treasure or trap`,
  );
}
