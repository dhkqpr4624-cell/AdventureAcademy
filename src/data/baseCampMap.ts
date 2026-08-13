import type { BaseCampMapDefinition } from "../types/baseCamp";
import dungeonEntranceButton from "../assets/baseCamp/dungeonEntrance_button.png";
import {
  BASE_CAMP_NPC_SLOT_IDS,
  getBaseCampNpcFocusTarget,
} from "../game/npc/baseCampNpcSlots";

const baseCampAssetUrl = (fileName: string) =>
  `${import.meta.env.BASE_URL}assets/baseCamp/${fileName}`;

const lunaNpcFocus = getBaseCampNpcFocusTarget(
  BASE_CAMP_NPC_SLOT_IDS.lunaOriginal,
);
const theoNpcFocus = getBaseCampNpcFocusTarget(
  BASE_CAMP_NPC_SLOT_IDS.theoOriginal,
);
const kaidenNpcFocus = getBaseCampNpcFocusTarget(
  BASE_CAMP_NPC_SLOT_IDS.kaidenOriginal,
);
const jeonNpcFocus = getBaseCampNpcFocusTarget(BASE_CAMP_NPC_SLOT_IDS.jeon);

export const BASE_CAMP_MAP: BaseCampMapDefinition = {
  id: "academy-base-camp",
  worldWidth: 1672,
  worldHeight: 941,
  layers: {
    background: baseCampAssetUrl("background.png"),
    ground: baseCampAssetUrl("ground.png"),
    dungeonEntrance: baseCampAssetUrl("dungeonEntrance.png"),
    dungeonEntranceButton,
    foreground: baseCampAssetUrl("foreground.png"),
  },
  focusPoints: {
    campCenter: {
      id: "campCenter",
      x: 836,
      y: 520,
      zoom: 1,
    },
    dungeonEntrance: {
      id: "dungeonEntrance",
      x: 805,
      y: 565,
      zoom: 1.45,
      offsetY: -20,
    },
    questNpc01: {
      id: "questNpc01",
      x: 1370,
      y: 620,
      zoom: 1.35,
      offsetY: -30,
    },
    lunaNpc: {
      id: "lunaNpc",
      ...lunaNpcFocus,
      zoom: 1.4,
    },
    theoNpc: {
      id: "theoNpc",
      ...theoNpcFocus,
      zoom: 1.4,
    },
    kaidenNpc: {
      id: "kaidenNpc",
      ...kaidenNpcFocus,
      zoom: 1.4,
    },
    jeonNpc: {
      id: "jeonNpc",
      ...jeonNpcFocus,
      zoom: 1.4,
    },
  },
  interactionRegions: [
    {
      id: "dungeonEntrance",
      label: "dungeonEntrance",
      x: 675,
      y: 475,
      width: 260,
      height: 270,
    },
    {
      id: "questNpc01",
      label: "questNpc01 (임시 영역)",
      x: 1270,
      y: 520,
      width: 210,
      height: 220,
      markerX: 1375,
      markerY: 610,
    },
  ],
};
