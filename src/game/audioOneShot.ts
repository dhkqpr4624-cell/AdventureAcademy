const POOL_SIZE = 8;

type AudioPool = {
  nextIndex: number;
  players: HTMLAudioElement[];
};

const pools = new Map<string, AudioPool>();

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
  audio.volume = 0.2 + Math.random() * 0.6;
  void audio.play().catch(() => {
    // 오디오 재생이 제한되어도 게임 진행은 유지한다.
  });
}
