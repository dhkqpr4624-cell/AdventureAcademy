import { NPC_BY_ID } from "../npc/npcDefinitions";
import { resolveNpcQuestMarker } from "./questMarkerResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[quest marker checks] ${message}`);
}

export function runQuestMarkerChecks() {
  const kaiden = NPC_BY_ID.kaiden;
  const questId = kaiden.offeredQuestIds[0];

  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "available" }) === "available",
    "available quest must resolve to !",
  );
  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "readyToComplete" }) ===
      "readyToComplete",
    "ready-to-complete quest must resolve to ?",
  );
  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "active" }) === "none",
    "active quest must not show a marker",
  );
  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "completed" }) === "none",
    "completed quest must not show a marker",
  );
  assert(
    resolveNpcQuestMarker(
      { offeredQuestIds: ["available-quest", "ready-quest"] },
      {
        "available-quest": "available",
        "ready-quest": "readyToComplete",
      },
    ) === "readyToComplete",
    "ready-to-complete must take priority over available",
  );
  assert(
    resolveNpcQuestMarker(NPC_BY_ID.luna, { [questId]: "available" }) ===
      "none" &&
      resolveNpcQuestMarker(NPC_BY_ID.theo, { [questId]: "available" }) ===
        "none",
    "quest-less NPCs must not inherit a marker from a slot or another NPC",
  );
}
