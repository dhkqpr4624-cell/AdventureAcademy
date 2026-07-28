import type { QuestMarkerType } from "../game/quest/questMarkerResolver";

type NpcQuestMarkerProps = {
  displayName: string;
  marker: Exclude<QuestMarkerType, "none">;
};

export function NpcQuestMarker({
  displayName,
  marker,
}: NpcQuestMarkerProps) {
  const readyToComplete = marker === "readyToComplete";
  const accessibleLabel = readyToComplete
    ? `${displayName}에게 완료 보고 가능한 퀘스트가 있습니다.`
    : `${displayName}에게 수주 가능한 퀘스트가 있습니다.`;

  return (
    <span
      className={`base-camp-npc-quest-marker is-${marker}`}
      aria-label={accessibleLabel}
      role="img"
    >
      <span aria-hidden="true">{readyToComplete ? "?" : "!"}</span>
    </span>
  );
}
