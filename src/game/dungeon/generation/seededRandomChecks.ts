import { createSeededRandom, deriveAttemptSeed } from "./seededRandom";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[seededRandomChecks] ${message}`);
}

export function runSeededRandomChecks(): void {
  const values = (seed: string) => {
    const random = createSeededRandom(seed);
    return Array.from({ length: 12 }, () => random.next());
  };
  const first = values("repeatable");
  const second = values("repeatable");
  check(JSON.stringify(first) === JSON.stringify(second), "same seed must repeat");
  check(
    JSON.stringify(first) !== JSON.stringify(values("different")),
    "different seeds should differ",
  );
  check(first.every((value) => value >= 0 && value < 1), "values must be in [0, 1)");
  check(
    deriveAttemptSeed("base", 2, "floor1-branch-a") ===
      deriveAttemptSeed("base", 2, "floor1-branch-a"),
    "attempt seed must repeat",
  );
  console.info("seeded random checks: PASS");
}
