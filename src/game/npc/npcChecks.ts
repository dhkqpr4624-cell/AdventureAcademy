import { NPC_DEFINITIONS } from "./npcDefinitions";
import { resolveNextBlinkDelay } from "./npcIdleResolver";
import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";
import { QUEST_DEFINITIONS } from "../quest/questDefinitions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[npc checks] ${message}`);
}

export function runNpcChecks() {
  const ids = new Set<string>();
  for (const npc of NPC_DEFINITIONS) {
    assert(!ids.has(npc.id), `duplicate NPC id: ${npc.id}`);
    ids.add(npc.id);
    assert(Boolean(npc.baseCampSpawnId), `${npc.id} has no spawn`);
    assert(Boolean(npc.idle.standingImage), `${npc.id} has no standing image`);
    assert(npc.idle.blinkFrameCount > 0, `${npc.id} has no blink frames`);
    assert(
      npc.idle.minBlinkIntervalMs < npc.idle.maxBlinkIntervalMs,
      `${npc.id} has invalid blink interval`,
    );
    assert(Boolean(npc.portraits.default), `${npc.id} has no default portrait`);
    for (const sequenceId of Object.values(npc.dialogue)) {
      assert(
        !sequenceId || Boolean(NPC_STORY_SEQUENCES[sequenceId]),
        `${npc.id} references missing story ${sequenceId}`,
      );
    }
    for (const questId of npc.offeredQuestIds) {
      assert(
        QUEST_DEFINITIONS.some((quest) => quest.id === questId),
        `${npc.id} references missing quest ${questId}`,
      );
    }
  }
  assert(resolveNextBlinkDelay(0, 5000, 10000) === 5000, "random 0");
  assert(resolveNextBlinkDelay(1, 5000, 10000) === 10000, "random 1");
  assert(
    resolveNextBlinkDelay(0.5, 5000, 10000) === 7500,
    "random midpoint",
  );
}

