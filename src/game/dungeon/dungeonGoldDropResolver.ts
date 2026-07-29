import { createSeededRandom, deriveAttemptSeed } from "./generation/seededRandom";
import { getGoldRangeForFloor } from "../balance/floorBalance";

export type GoldDropKind = "normal" | "elite" | "treasure";

export function resolveDungeonGoldDrop(
  seed: string,
  roomId: string,
  kind: GoldDropKind,
  floorNumber = 1,
): number {
  const [minimum, maximum] = getGoldRangeForFloor(floorNumber, kind);
  const random = createSeededRandom(
    deriveAttemptSeed(seed, 0, `gold:${roomId}:${kind}`),
  );
  return minimum + Math.floor(random.next() * (maximum - minimum + 1));
}
