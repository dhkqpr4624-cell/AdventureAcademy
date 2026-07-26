import type {
  DungeonRoomNode,
  DungeonRoomProgress,
} from "./dungeonTypes";

export type RoomEntryAction =
  | { type: "explore"; message: string }
  | { type: "startCombat" }
  | { type: "skipCompletedCombat"; message: string };

export function resolveRoomEntry(
  room: DungeonRoomNode,
  progress: DungeonRoomProgress,
): RoomEntryAction {
  switch (room.type) {
    case "start":
      return { type: "explore", message: "던전의 시작점이다." };
    case "empty":
      return { type: "explore", message: "조용한 방이다." };
    case "combat":
      return progress.eventCompleted
        ? {
            type: "skipCompletedCombat",
            message: "이미 이벤트가 끝난 방이다.",
          }
        : { type: "startCombat" };
  }
}
