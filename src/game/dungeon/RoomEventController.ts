import type {
  DungeonRoomNode,
  DungeonRoomProgress,
} from "./dungeonTypes";

export type RoomEntryAction =
  | { type: "explore"; message: string }
  | { type: "startCombat" }
  | { type: "startEliteCombat" }
  | { type: "skipCompletedCombat"; message: string }
  | { type: "showTreasure"; message: string }
  | { type: "startTrap"; message: string };

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
    case "elite":
      return progress.eventCompleted
        ? {
            type: "skipCompletedCombat",
            message: "이미 이벤트가 끝난 정예방이다.",
          }
        : { type: "startEliteCombat" };
    case "treasure":
      return {
        type: "showTreasure",
        message: progress.eventCompleted
          ? progress.eventResult === "treasureOpened"
            ? "이미 연 보물상자다."
            : "상자는 단단히 잠겨 있다."
          : "닫힌 보물상자가 놓여 있다.",
      };
    case "trap":
      return progress.eventCompleted
        ? { type: "explore", message: "이미 작동이 끝난 함정이다." }
        : { type: "startTrap", message: "스위치를 밟았다!" };
  }
}
