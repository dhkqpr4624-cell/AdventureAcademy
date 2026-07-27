import { NPC_DEFINITIONS } from "./npcDefinitions";
import { resolveNextBlinkDelay } from "./npcIdleResolver";
import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";
import { QUEST_DEFINITIONS } from "../quest/questDefinitions";
import { BASE_CAMP_LAYER } from "../baseCamp/baseCampLayers";
import {
  BASE_CAMP_NPC_DISPLAY_SCALE,
  BASE_CAMP_NPC_SLOT_ASSIGNMENTS,
  BASE_CAMP_NPC_SLOTS,
  BASE_CAMP_NPC_UPWARD_SHIFT,
  getBaseCampNpcFocusTarget,
  getBaseCampNpcPlacement,
  type BaseCampNpcSlotId,
} from "./baseCampNpcSlots";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[npc checks] ${message}`);
}

export function runNpcChecks() {
  const ids = new Set<string>();
  const occupiedSlots = new Set<string>();
  for (const npc of NPC_DEFINITIONS) {
    assert(!ids.has(npc.id), `duplicate NPC id: ${npc.id}`);
    ids.add(npc.id);
    assert(
      npc.baseCampSpawnId in BASE_CAMP_NPC_SLOTS,
      `${npc.id} references invalid BaseCamp slot: ${npc.baseCampSpawnId}`,
    );
    assert(
      !occupiedSlots.has(npc.baseCampSpawnId),
      `duplicate BaseCamp slot: ${npc.baseCampSpawnId}`,
    );
    occupiedSlots.add(npc.baseCampSpawnId);
    assert(Boolean(npc.idle.standingImage), `${npc.id} has no standing image`);
    assert(npc.idle.blinkFrameCount > 0, `${npc.id} has no blink frames`);
    assert(
      npc.idle.minBlinkIntervalMs < npc.idle.maxBlinkIntervalMs,
      `${npc.id} has invalid blink interval`,
    );
    assert(Boolean(npc.portraits.default), `${npc.id} has no default portrait`);
    const expectedPlacement = getBaseCampNpcPlacement(
      npc.baseCampSpawnId as BaseCampNpcSlotId,
    );
    assert(
      npc.placement.width === expectedPlacement.width &&
        npc.placement.height === expectedPlacement.height,
      `${npc.id} standing and blink must share the common display scale`,
    );
    assert(
      npc.placement.x === expectedPlacement.x &&
        npc.placement.y === expectedPlacement.y,
      `${npc.id} placement must preserve its slot foot anchor`,
    );
    const slot = BASE_CAMP_NPC_SLOTS[npc.baseCampSpawnId as BaseCampNpcSlotId];
    assert(
      npc.placement.width === 114 && npc.placement.height === 180,
      `${npc.id} final display size must be 114x180`,
    );
    assert(
      npc.placement.x + npc.placement.width / 2 === slot.anchorX,
      `${npc.id} horizontal foot anchor must not move`,
    );
    assert(
      npc.placement.y + npc.placement.height ===
        slot.previousAnchorY - BASE_CAMP_NPC_UPWARD_SHIFT,
      `${npc.id} foot anchor must be 60px below the previous placement`,
    );
    const focusTarget = getBaseCampNpcFocusTarget(
      npc.baseCampSpawnId as BaseCampNpcSlotId,
    );
    assert(
      focusTarget.x === slot.anchorX &&
        focusTarget.y === npc.placement.y + npc.placement.height / 2,
      `${npc.id} focus target must match the rendered center`,
    );
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
  assert(occupiedSlots.size === 3, "all three NPCs must use different slots");
  assert(
    BASE_CAMP_NPC_DISPLAY_SCALE === 0.6,
    "common NPC display scale must be 0.6",
  );
  assert(
    BASE_CAMP_NPC_UPWARD_SHIFT === 30,
    "common NPC upward shift must be 30px after moving NPCs down by 60px",
  );
  assert(
    BASE_CAMP_NPC_SLOT_ASSIGNMENTS.theo === "lunaNpc",
    "Theo must use the original Luna slot",
  );
  assert(
    BASE_CAMP_NPC_SLOT_ASSIGNMENTS.kaiden === "theoNpc",
    "Kaiden must use the original Theo slot",
  );
  assert(
    BASE_CAMP_NPC_SLOT_ASSIGNMENTS.luna === "kaidenNpc",
    "Luna must use the original Kaiden slot",
  );
  assert(
    BASE_CAMP_LAYER.background < BASE_CAMP_LAYER.structures,
    "structures must be above background",
  );
  assert(
    BASE_CAMP_LAYER.structures < BASE_CAMP_LAYER.ground,
    "ground must be above structures",
  );
  assert(
    BASE_CAMP_LAYER.ground < BASE_CAMP_LAYER.foreground,
    "foreground must be above ground",
  );
  assert(
    BASE_CAMP_LAYER.foreground < BASE_CAMP_LAYER.npcSprite,
    "NPC layer must be above foreground and every BaseCamp image layer",
  );
  assert(
    BASE_CAMP_LAYER.npcSprite < BASE_CAMP_LAYER.interactionOverlay,
    "interaction overlay must be above NPC sprites",
  );
  assert(
    BASE_CAMP_LAYER.interactionOverlay < BASE_CAMP_LAYER.highlight,
    "highlight must be above interaction overlay",
  );
  assert(resolveNextBlinkDelay(0, 5000, 10000) === 5000, "random 0");
  assert(resolveNextBlinkDelay(1, 5000, 10000) === 10000, "random 1");
  assert(
    resolveNextBlinkDelay(0.5, 5000, 10000) === 7500,
    "random midpoint",
  );
}
