import lunaStanding from "../../assets/npcs/luna/luna_standing.png";
import lunaBlink from "../../assets/npcs/luna/luna_blink.png";
import lunaPortrait from "../../assets/npcs/luna/luna_portrait.png";
import theoStanding from "../../assets/npcs/theo/theo_standing.png";
import theoBlink from "../../assets/npcs/theo/theo_blink.png";
import theoPortrait from "../../assets/npcs/theo/theo_portrait.png";
import kaidenStanding from "../../assets/npcs/kaiden/kaiden_standing.png";
import kaidenBlink from "../../assets/npcs/kaiden/kaiden_blink.png";
import kaidenPortrait from "../../assets/npcs/kaiden/kaiden_portrait.png";
import type { NpcDefinition, NpcId } from "./npcTypes";
import {
  BASE_CAMP_NPC_SLOT_ASSIGNMENTS,
  getBaseCampNpcPlacement,
} from "./baseCampNpcSlots";

const commonIdle = {
  blinkFrameWidth: 380,
  blinkFrameHeight: 600,
  blinkFrameDurationMs: 200,
  minBlinkIntervalMs: 5000,
  maxBlinkIntervalMs: 10000,
};

export const NPC_DEFINITIONS: readonly NpcDefinition[] = [
  {
    id: "luna",
    displayName: "루나",
    role: "지형 분석가",
    baseCampDisplayRole: "지형 분석가",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.luna,
    idle: {
      ...commonIdle,
      standingImage: lunaStanding,
      blinkSpriteSheet: lunaBlink,
      blinkFrameCount: 4,
    },
    portraits: { default: lunaPortrait, happy: lunaPortrait },
    dialogue: {
      defaultStorySequenceId: "npc-luna-default",
      questAvailableStorySequenceId: "npc-luna-floor-2-quest-available",
      questActiveStorySequenceId: "npc-luna-floor-2-quest-active",
    },
    offeredQuestIds: ["quest-floor-2-torn-cloth"],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.luna),
  },
  {
    id: "theo",
    displayName: "테오",
    role: "보급 담당",
    baseCampDisplayRole: "상점",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.theo,
    idle: {
      ...commonIdle,
      standingImage: theoStanding,
      blinkSpriteSheet: theoBlink,
      blinkFrameCount: 4,
    },
    portraits: { default: theoPortrait },
    dialogue: { defaultStorySequenceId: "npc-theo-default" },
    offeredQuestIds: [],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.theo),
  },
  {
    id: "kaiden",
    displayName: "카이든",
    role: "지휘관",
    baseCampDisplayRole: "지휘관",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.kaiden,
    idle: {
      ...commonIdle,
      standingImage: kaidenStanding,
      blinkSpriteSheet: kaidenBlink,
      blinkFrameCount: 7,
      sourceSheetWidth: 2048,
      sourceSheetHeight: 461,
    },
    portraits: { default: kaidenPortrait, serious: kaidenPortrait },
    dialogue: {
      defaultStorySequenceId: "npc-kaiden-default",
      questAvailableStorySequenceId: "npc-kaiden-quest-available",
      questActiveStorySequenceId: "npc-kaiden-quest-active",
    },
    offeredQuestIds: ["quest-floor-1-memory-fragment"],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.kaiden),
  },
];

export const NPC_BY_ID = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.id, npc]),
) as Record<NpcId, NpcDefinition>;
