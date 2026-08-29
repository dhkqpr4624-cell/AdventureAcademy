const POOL_SIZE = 8;

type AudioPool = {
  nextIndex: number;
  players: HTMLAudioElement[];
};

const pools = new Map<string, AudioPool>();

const VOLUME_RANGES = {
  button: [0.22, 0.38],
  hit: [0.32, 0.55],
  heal: [0.30, 0.50],
  glass: [0.38, 0.62],
  golem: [0.42, 0.68],
  fallback: [0.28, 0.52],
} as const;

function getVolumeRange(url: string): readonly [number, number] {
  if (url.includes("button-clicked-sfx")) return VOLUME_RANGES.button;
  if (url.includes("hit-sfx")) return VOLUME_RANGES.hit;
  if (url.includes("heal-sfx")) return VOLUME_RANGES.heal;
  if (url.includes("glass-shatter-sfx")) return VOLUME_RANGES.glass;
  if (url.includes("golem-shouting-sfx")) return VOLUME_RANGES.golem;
  return VOLUME_RANGES.fallback;
}

function getPool(url: string): AudioPool | null {
  if (typeof Audio === "undefined") return null;
  const existing = pools.get(url);
  if (existing) return existing;

  const pool: AudioPool = {
    nextIndex: 0,
    players: Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(url);
      audio.loop = false;
      audio.preload = "auto";
      return audio;
    }),
  };
  pools.set(url, pool);
  return pool;
}

export function playRandomizedOneShot(url: string): void {
  const pool = getPool(url);
  if (!pool) return;

  const audio = pool.players[pool.nextIndex];
  pool.nextIndex = (pool.nextIndex + 1) % pool.players.length;
  audio.pause();
  audio.currentTime = 0;
  audio.playbackRate = 0.85 + Math.random() * 0.3;
  const [minimumVolume, maximumVolume] = getVolumeRange(url);
  audio.volume = minimumVolume + Math.random() * (maximumVolume - minimumVolume);
  void audio.play().catch(() => {
    // 오디오 재생이 제한되어도 게임 진행은 유지한다.
  });
}
