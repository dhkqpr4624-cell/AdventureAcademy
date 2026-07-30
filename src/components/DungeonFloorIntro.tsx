import { getDungeonFloorTitle } from "../data/DungeonFloorTitles";

export function DungeonFloorIntro({ floorId }: { floorId: string }) {
  const floor = getDungeonFloorTitle(floorId);
  if (!floor) return null;
  return (
    <div className="dungeon-floor-intro" role="status" aria-label={`${floor.title} ${floor.subtitle}`}>
      <div className="dungeon-floor-intro-title">
        <span aria-hidden="true" />
        <h1>{floor.title}</h1>
        <p>&lt;{floor.subtitle}&gt;</p>
        <span aria-hidden="true" />
      </div>
    </div>
  );
}
