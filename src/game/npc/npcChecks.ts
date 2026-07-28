import { NPC_BY_ID, NPC_DEFINITIONS } from "./npcDefinitions";
import { resolveNextBlinkDelay } from "./npcIdleResolver";
import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";
import { QUEST_DEFINITIONS } from "../quest/questDefinitions";
import { BASE_CAMP_LAYER } from "../baseCamp/baseCampLayers";
import { NPC_PORTRAIT_REGISTRY } from "./npcPortraitRegistry";
import { resolveNpcPresentation } from "./npcPresentationResolver";
import { resolveNpcStorySequence } from "./npcStoryResolver";
import type { NpcId } from "./npcTypes";
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
  const identityExpectations = {
    luna: {
      displayName: "루나",
      role: "지형 분석가",
      defaultStorySequenceId: "npc-luna-default",
    },
    theo: {
      displayName: "테오",
      role: "보급 담당",
      defaultStorySequenceId: "npc-theo-default",
    },
    kaiden: {
      displayName: "카이든",
      role: "지휘관",
      defaultStorySequenceId: "npc-kaiden-default",
    },
  } as const satisfies Record<
    NpcId,
    {
      displayName: string;
      role: string;
      defaultStorySequenceId: string;
    }
  >;
  for (const npcId of Object.keys(identityExpectations) as NpcId[]) {
    const expected = identityExpectations[npcId];
    const presentation = resolveNpcPresentation(npcId);
    assert(presentation.id === npcId, `${npcId} presentation id mismatch`);
    assert(
      presentation.displayName === expected.displayName,
      `${npcId} display name mismatch`,
    );
    assert(presentation.role === expected.role, `${npcId} role mismatch`);
    assert(
      presentation.dialogue.defaultStorySequenceId ===
        expected.defaultStorySequenceId,
      `${npcId} default story mismatch`,
    );
    assert(
      NPC_PORTRAIT_REGISTRY[`${npcId}.default`] ===
        NPC_BY_ID[npcId].portraits.default,
      `${npcId} portrait registry must resolve by NPC id`,
    );
    assert(
      resolveNpcStorySequence(npcId, {}) ===
        expected.defaultStorySequenceId,
      `${npcId} story resolver must resolve by NPC id`,
    );
    const story =
      NPC_STORY_SEQUENCES[expected.defaultStorySequenceId];
    assert(
      story.actors[npcId]?.name === expected.displayName &&
        story.actors[npcId]?.role === expected.role,
      `${npcId} story actor metadata must come from its NPC definition`,
    );
  }
  assert(
    resolveNpcStorySequence("kaiden", {
      "quest-floor-1-memory-fragment": "available",
    }) === "npc-kaiden-quest-available",
    "Kaiden must retain the available quest story",
  );
  assert(
    resolveNpcStorySequence("luna", {
      "quest-floor-1-memory-fragment": "available",
    }) === "npc-luna-default" &&
      resolveNpcStorySequence("theo", {
        "quest-floor-1-memory-fragment": "available",
      }) === "npc-theo-default",
    "Kaiden's slot or quest status must not leak into Luna or Theo stories",
  );
  for (const quest of QUEST_DEFINITIONS) {
    const giver = NPC_BY_ID[quest.giverNpcId];
    assert(Boolean(giver), `${quest.id} has an invalid giverNpcId`);
    assert(
      giver.offeredQuestIds.includes(quest.id),
      `${quest.id} must be offered by its giverNpcId`,
    );
  }
  assert(
    BASE_CAMP_NPC_SLOTS.lunaNpc.anchorX === 425 &&
      BASE_CAMP_NPC_SLOTS.lunaNpc.previousAnchorY === 795 &&
      BASE_CAMP_NPC_SLOTS.theoNpc.anchorX === 655 &&
      BASE_CAMP_NPC_SLOTS.theoNpc.previousAnchorY === 795 &&
      BASE_CAMP_NPC_SLOTS.kaidenNpc.anchorX === 1195 &&
      BASE_CAMP_NPC_SLOTS.kaidenNpc.previousAnchorY === 795,
    "protected BaseCamp slot coordinates changed",
  );
  assert(
    getBaseCampNpcPlacement("lunaNpc").x === 368 &&
      getBaseCampNpcPlacement("lunaNpc").y === 572 &&
      getBaseCampNpcPlacement("theoNpc").x === 598 &&
      getBaseCampNpcPlacement("theoNpc").y === 572 &&
      getBaseCampNpcPlacement("kaidenNpc").x === 1138 &&
      getBaseCampNpcPlacement("kaidenNpc").y === 572,
    "protected BaseCamp placement coordinates changed",
  );
  assert(
    BASE_CAMP_NPC_DISPLAY_SCALE === 0.6,
    "common NPC display scale must be 0.6",
  );
  assert(
    BASE_CAMP_NPC_UPWARD_SHIFT === 43,
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
