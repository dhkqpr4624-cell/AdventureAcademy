export function resolveNextBlinkDelay(
  randomValue: number,
  minMs: number,
  maxMs: number,
) {
  const normalized = Math.min(Math.max(randomValue, 0), 1);
  return Math.round(minMs + (maxMs - minMs) * normalized);
}

