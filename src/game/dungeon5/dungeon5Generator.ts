export type Dungeon5RouteStop = {
  id: "start" | "normal-1" | "normal-2" | "elite" | "gate";
  monsterId?: "monster-floor5-baekje-archer" | "monster-floor5-goguryeo-cavalry" | "monster-floor5-corrupted-munmu-wraith";
  monsterName?: string;
  monsterImage?: string;
  sceneryImage?: string;
};

const scenery = ["background-combat-1.png", "background-combat-2.png", "background-combat-3.png"] as const;

export function createDungeon5Route(random: () => number = Math.random): readonly Dungeon5RouteStop[] {
  const shuffled = [...scenery].sort(() => random() - 0.5);
  return [
    { id: "start" },
    { id: "normal-1", monsterId: "monster-floor5-baekje-archer", monsterName: "백제 궁병", monsterImage: "baekje-archer.png", sceneryImage: shuffled[0] },
    { id: "normal-2", monsterId: "monster-floor5-goguryeo-cavalry", monsterName: "고구려 기마병", monsterImage: "goguryeo-cavalry.png", sceneryImage: shuffled[1] },
    { id: "elite", monsterId: "monster-floor5-corrupted-munmu-wraith", monsterName: "오염된 문무왕의 망령", monsterImage: "corrupted-munmu-wraith.png", sceneryImage: shuffled[2] },
    { id: "gate" },
  ];
}

export function getDungeon5Directions(position: number, routeLength: number) {
  return { canMoveBack: position > 0, canMoveForward: position < routeLength - 1 } as const;
}
