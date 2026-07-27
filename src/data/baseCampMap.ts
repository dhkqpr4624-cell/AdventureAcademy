import type { BaseCampMapDefinition } from "../types/baseCamp";

const baseCampAssetUrl = (fileName: string) =>
  `${import.meta.env.BASE_URL}assets/baseCamp/${fileName}`;

export const BASE_CAMP_MAP: BaseCampMapDefinition = {
  id: "academy-base-camp",
  worldWidth: 1672,
  worldHeight: 941,
  layers: {
    background: baseCampAssetUrl("background.png"),
    ground: baseCampAssetUrl("ground.png"),
    dungeonEntrance: baseCampAssetUrl("dungeonEntrance.png"),
    foreground: baseCampAssetUrl("foreground.png"),
  },
  focusPoints: {
    campCenter: {
      id: "campCenter",
      x: 836,
      y: 520,
      zoom: 1,
    },
    shop: {
      id: "shop",
      x: 250,
      y: 620,
      zoom: 1.35,
      offsetY: -30,
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
      x: 525,
      y: 565,
      zoom: 1.4,
      offsetY: -35,
    },
    theoNpc: {
      id: "theoNpc",
      x: 1135,
      y: 565,
      zoom: 1.4,
      offsetY: -35,
    },
    kaidenNpc: {
      id: "kaidenNpc",
      x: 1395,
      y: 555,
      zoom: 1.4,
      offsetY: -35,
    },
  },
  interactionRegions: [
    {
      id: "shop",
      label: "shop (임시 영역)",
      x: 105,
      y: 515,
      width: 300,
      height: 225,
      markerX: 250,
      markerY: 610,
    },
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
