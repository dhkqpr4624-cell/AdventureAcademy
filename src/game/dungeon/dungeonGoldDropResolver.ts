import { createSeededRandom, deriveAttemptSeed } from "./generation/seededRandom";

export type GoldDropKind = "normal" | "elite";

export function resolveDungeonGoldDrop(
  seed: string,
  roomId: string,
  kind: GoldDropKind,
): number {
  const minimum = kind === "elite" ? 3 : 1;
  const maximum = kind === "elite" ? 5 : 3;
  const random = createSeededRandom(
    deriveAttemptSeed(seed, 0, `gold:${roomId}:${kind}`),
  );
  return minimum + Math.floor(random.next() * (maximum - minimum + 1));
}

