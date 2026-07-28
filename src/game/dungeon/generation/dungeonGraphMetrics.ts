import type {
  DungeonConnection,
  DungeonRoomNode,
  DungeonRoomType,
} from "../dungeonTypes";

export const QUESTION_COST_BY_ROOM_TYPE: Readonly<Record<DungeonRoomType, number>> = {
  start: 0,
  empty: 0,
  combat: 2,
  elite: 3,
  treasure: 1,
  trap: 1,
  quest: 0,
};

export function createAdjacency(
  rooms: readonly DungeonRoomNode[],
  connections: readonly DungeonConnection[],
): Map<string, Set<string>> {
  const adjacency = new Map(rooms.map((room) => [room.id, new Set<string>()]));
  for (const connection of connections) {
    adjacency.get(connection.fromRoomId)?.add(connection.toRoomId);
    adjacency.get(connection.toRoomId)?.add(connection.fromRoomId);
  }
  return adjacency;
}

export function distancesFrom(
  startRoomId: string,
  adjacency: Map<string, Set<string>>,
): Map<string, number> {
  const distances = new Map<string, number>();
  if (!adjacency.has(startRoomId)) return distances;
  const queue = [startRoomId];
  distances.set(startRoomId, 0);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (!distances.has(next)) {
        distances.set(next, distances.get(current)! + 1);
        queue.push(next);
      }
    }
  }
  return distances;
}

export function countCycles(
  roomCount: number,
  connectionCount: number,
  componentCount: number,
): number {
  return Math.max(0, connectionCount - roomCount + componentCount);
}

export function countComponents(adjacency: Map<string, Set<string>>): number {
  let count = 0;
  const visited = new Set<string>();
  for (const roomId of adjacency.keys()) {
    if (visited.has(roomId)) continue;
    count += 1;
    for (const id of distancesFrom(roomId, adjacency).keys()) visited.add(id);
  }
  return count;
}

export function isPurposeDeadEnd(room: DungeonRoomNode): boolean {
  return room.isFinalQuestRoom === true ||
    room.type === "quest" ||
    room.type === "treasure" ||
    room.type === "trap";
}
