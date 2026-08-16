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
    subtitle: "구석기와 신석기",
  },
  {
    floor: 2,
    floorId: "floor-2",
    title: "던전 2층",
    subtitle: "청동기와 고조선",
  },
  {
    floor: 3,
    floorId: "floor-3",
    title: "던전 3층",
    subtitle: "삼국의 발전 : 고구려와 백제",
  },
  {
    floor: 4,
    floorId: "floor-4",
    title: "던전 4층",
    subtitle: "삼국의 발전 : 신라와 가야",
  },
  { floor: 5, floorId: "floor-5", title: "던전 5층", subtitle: "통일 신라" },
  { floor: 6, floorId: "floor-6", title: "던전 6층", subtitle: "남북국시대 : 발해" },
];

export const getDungeonFloorTitle = (floorId: string) =>
  DUNGEON_FLOOR_TITLES.find((entry) => entry.floorId === floorId) ?? null;
