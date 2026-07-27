import lunaStanding from "../../assets/npcs/luna/luna_standing.png";
import lunaBlink from "../../assets/npcs/luna/luna_blink.png";
import theoStanding from "../../assets/npcs/theo/theo_standing.png";
import theoBlink from "../../assets/npcs/theo/theo_blink.png";
import kaidenStanding from "../../assets/npcs/kaiden/kaiden_standing.png";
import kaidenBlink from "../../assets/npcs/kaiden/kaiden_blink.png";
import type { NpcDefinition } from "./npcTypes";

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
    role: "지휘관",
    baseCampSpawnId: "lunaNpc",
    idle: {
      ...commonIdle,
      standingImage: lunaStanding,
      blinkSpriteSheet: lunaBlink,
      blinkFrameCount: 4,
    },
    portraits: { default: lunaStanding, happy: lunaStanding },
    dialogue: { defaultStorySequenceId: "npc-luna-default" },
    offeredQuestIds: [],
    placement: { x: 430, y: 415, width: 190, height: 300 },
  },
  {
    id: "theo",
    displayName: "테오",
    role: "보급 담당",
    baseCampSpawnId: "theoNpc",
    idle: {
      ...commonIdle,
      standingImage: theoStanding,
      blinkSpriteSheet: theoBlink,
      blinkFrameCount: 4,
    },
    portraits: { default: theoStanding },
    dialogue: { defaultStorySequenceId: "npc-theo-default" },
    offeredQuestIds: [],
    placement: { x: 1040, y: 415, width: 190, height: 300 },
  },
  {
    id: "kaiden",
    displayName: "카이든",
    role: "탐험가",
    baseCampSpawnId: "kaidenNpc",
    idle: {
      ...commonIdle,
      standingImage: kaidenStanding,
      blinkSpriteSheet: kaidenBlink,
      blinkFrameCount: 7,
      sourceSheetWidth: 2048,
      sourceSheetHeight: 461,
    },
    portraits: { default: kaidenStanding, serious: kaidenStanding },
    dialogue: {
      defaultStorySequenceId: "npc-kaiden-default",
      questAvailableStorySequenceId: "npc-kaiden-quest-available",
      questActiveStorySequenceId: "npc-kaiden-quest-active",
    },
    offeredQuestIds: ["quest-floor-1-memory-fragment"],
    placement: { x: 1300, y: 405, width: 190, height: 300 },
  },
];

export const NPC_BY_ID = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.id, npc]),
) as Record<string, NpcDefinition>;

