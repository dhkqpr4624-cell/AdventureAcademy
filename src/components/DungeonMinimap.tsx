import type {
  DungeonMapDefinition,
  DungeonRoomProgress,
} from "../game/dungeon/dungeonTypes";
import { canEnterFinalRoom } from "../game/dungeon/dungeonExplorationResolver";

type DungeonMinimapProps = {
  map: DungeonMapDefinition;
  currentRoomId: string;
  roomProgress: Record<string, DungeonRoomProgress>;
};

const SIZE = 184;
const PADDING = 18;

export function DungeonMinimap({
  map,
  currentRoomId,
  roomProgress,
}: DungeonMinimapProps) {
  const xs = map.rooms.map((room) => room.position.x);
  const zs = map.rooms.map((room) => room.position.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const scaleX = (SIZE - PADDING * 2) / Math.max(1, maxX - minX);
  const scaleZ = (SIZE - PADDING * 2) / Math.max(1, maxZ - minZ);
  const scale = Math.min(scaleX, scaleZ);
  const contentWidth = (maxX - minX) * scale;
  const contentHeight = (maxZ - minZ) * scale;
  const offsetX = (SIZE - contentWidth) / 2;
  const offsetY = (SIZE - contentHeight) / 2;
  const point = (roomId: string) => {
    const room = map.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error(`[DungeonMinimap] Unknown room: ${roomId}`);
    return {
      x: offsetX + (room.position.x - minX) * scale,
      y: offsetY + (room.position.z - minZ) * scale,
    };
  };
  const finalUnlocked = canEnterFinalRoom(map, roomProgress);

  return (
    <aside className="dungeon-minimap" aria-label="던전 미니맵">
      <div className="dungeon-minimap-title">MAP</div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img">
        <g className="dungeon-minimap-connections">
          {map.connections.map((connection) => {
            const from = point(connection.fromRoomId);
            const to = point(connection.toRoomId);
            return (
              <line
                key={connection.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
        </g>
        <g className="dungeon-minimap-rooms">
          {map.rooms.map((room) => {
            const position = point(room.id);
            const isCurrent = room.id === currentRoomId;
            const isFinal = room.isFinalQuestRoom === true;
            const resolved = roomProgress[room.id]?.eventCompleted === true;
            const className = [
              "dungeon-minimap-room",
              resolved ? "is-resolved" : "is-unresolved",
              isCurrent ? "is-current" : "",
              isFinal ? "is-final" : "",
              isFinal && !finalUnlocked ? "is-locked" : "",
            ].filter(Boolean).join(" ");
            return (
              <g key={room.id} className={className}>
                <rect
                  x={position.x - 6}
                  y={position.y - 6}
                  width="12"
                  height="12"
                  rx="1"
                />
                {isFinal && (
                  <text x={position.x} y={position.y + 3.5} textAnchor="middle">
                    {finalUnlocked ? "★" : "×"}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </aside>
  );
}
