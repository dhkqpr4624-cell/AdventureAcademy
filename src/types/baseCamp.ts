export type BaseCampMode = "play" | "story";

export type BaseCampFocusPoint = {
  id: string;
  x: number;
  y: number;
  zoom: number;
  offsetX?: number;
  offsetY?: number;
};

export type BaseCampInteractionRegion = {
  id: "shop" | "dungeonEntrance" | "questNpc01";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  markerX?: number;
  markerY?: number;
};

export type BaseCampMapDefinition = {
  id: string;
  worldWidth: number;
  worldHeight: number;
  layers: {
    background: string;
    ground: string;
    dungeonEntrance: string;
    dungeonEntranceButton: string;
    foreground: string;
  };
  focusPoints: Record<string, BaseCampFocusPoint>;
  interactionRegions: BaseCampInteractionRegion[];
};
