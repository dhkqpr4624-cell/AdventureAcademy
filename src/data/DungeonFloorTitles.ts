export type DungeonFloorTitle = {
  floor: number;
  floorId: string;
  title: string;
  subtitle: string;
};

export const DUNGEON_FLOOR_TITLES: DungeonFloorTitle[] = [
  {
    floor: 1,
    floorId: "floor-1",
    title: "던전 1층",
    subtitle: "고조선과 청동기",
  },
];

export const getDungeonFloorTitle = (floorId: string) =>
  DUNGEON_FLOOR_TITLES.find((entry) => entry.floorId === floorId) ?? null;
