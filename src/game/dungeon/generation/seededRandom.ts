export type RandomSource = {
  next(): number;
};

export function normalizeSeed(seed: number | string): number {
  if (typeof seed === "number") {
    return (Number.isFinite(seed) ? seed : 0) >>> 0;
  }
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: number | string): RandomSource {
  let state = normalizeSeed(seed);
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function deriveAttemptSeed(
  baseSeed: number | string,
  attemptIndex: number,
  templateId: string,
): string {
  return `${String(baseSeed)}::${templateId}::attempt-${attemptIndex}`;
}

export function chooseSeeded<T>(
  values: readonly T[],
  random: RandomSource,
): T {
  if (values.length === 0) {
    throw new Error("[seededRandom] Cannot choose from an empty list");
  }
  return values[Math.floor(random.next() * values.length)];
}
