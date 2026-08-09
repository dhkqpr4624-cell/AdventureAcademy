const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

export function hasFinalConsonant(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  const code = text.charCodeAt(text.length - 1);
  return code >= HANGUL_BASE && code <= HANGUL_END
    ? (code - HANGUL_BASE) % 28 !== 0
    : false;
}

export function withSubjectParticle(value: string): string {
  return `${value}${hasFinalConsonant(value) ? "이" : "가"}`;
}

export function withObjectParticle(value: string): string {
  return `${value}${hasFinalConsonant(value) ? "을" : "를"}`;
}

export function withTopicParticle(value: string): string {
  return `${value}${hasFinalConsonant(value) ? "은" : "는"}`;
}

export const dungeonDialogue = {
  encounter: (monsterName: string, elite = false) =>
    `${elite ? "정예 몬스터, " : ""}${withSubjectParticle(monsterName)} 나타났다!`,
  attackTitle: (actorName: string) => `${actorName}의 공격!`,
  swingSword: (actorName: string) => `${withSubjectParticle(actorName)} 검을 휘두른다!`,
  defeatedMonster: (monsterName: string) => `${withObjectParticle(monsterName)} 쓰러뜨렸다!`,
  stunned: (monsterName: string) => `${withTopicParticle(monsterName)} 기절해서 움직일 수 없다!`,
  turn: (actorName: string) => `${actorName}의 턴!`,
  waryRetreat: (monsterName: string) => `${withSubjectParticle(monsterName)} 경계하며 뒤로 물러난다.`,
  askUseItem: (itemName: string) => `${withObjectParticle(itemName)} 사용할까?`,
  usedItem: (actorName: string, itemName: string) => `${withTopicParticle(actorName)} ${withObjectParticle(itemName)} 사용했다.`,
} as const;
