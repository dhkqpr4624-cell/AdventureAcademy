import * as THREE from "three";
import type {
  DungeonMapDefinition,
  WorldCardinalDirection,
} from "../../../game/dungeon/dungeonTypes";

export type DungeonMaterialKey = "wall" | "floor" | "ceiling";

export type RoomVisualTemplate = {
  id: string;
  width: number;
  height: number;
  depth: number;
  wallThickness: number;
  passageWidth: number;
  passageHeight: number;
  materials: Record<DungeonMaterialKey, string>;
};

export type CorridorTemplate = {
  id: string;
  width: number;
  height: number;
  wallThickness: number;
  materials: Record<DungeonMaterialKey, string>;
};

export type OpenPassageSocket = {
  roomId: string;
  direction: WorldCardinalDirection;
  width: number;
  height: number;
  localPosition: [number, number, number];
  localYaw: number;
};

export type DungeonTextureSet = Record<DungeonMaterialKey, THREE.Texture>;

export type DungeonVisualAssembly = {
  root: THREE.Group;
  roomGroups: Map<string, THREE.Group>;
  corridorGroups: Map<string, THREE.Group>;
  passageSockets: OpenPassageSocket[];
  setActiveRoom(roomId: string): void;
  dispose(): void;
};

export type AssembleDungeonVisualsInput = {
  dungeonMap: DungeonMapDefinition;
  roomTemplate: RoomVisualTemplate;
  corridorTemplate: CorridorTemplate;
  textures: DungeonTextureSet;
};
