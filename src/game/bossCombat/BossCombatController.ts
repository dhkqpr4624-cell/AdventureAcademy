import { createSeededRandom } from "../dungeon/generation/seededRandom";

export const BOSS_DODGE_HEAL_AMOUNT = 15;

export const BOSS_DODGE_DIRECTIONS = [
  "left",
  "front",
  "back",
  "right",
] as const;

export type BossDodgeDirection = (typeof BOSS_DODGE_DIRECTIONS)[number];
export type BossDodgeOutcome = "attack" | "survive" | "heal";
export type BossDodgeBoard = Readonly<Record<BossDodgeDirection, BossDodgeOutcome>>;

export const BOSS_DODGE_LABELS: Readonly<Record<BossDodgeDirection, string>> = {
  left: "← 왼쪽",
  front: "↑ 앞쪽",
  back: "↓ 뒤쪽",
  right: "→ 오른쪽",
};

export const BOSS_DODGE_OUTCOME_LABELS: Readonly<Record<BossDodgeOutcome, string>> = {
  attack: "공격!",
  survive: "생존",
  heal: "+15 회복!",
};

export function createBossDodgeBoard(seed: string): BossDodgeBoard {
  const random = createSeededRandom(seed);
  const healCount = random.next() < 0.5 ? 0 : 1;
  const attackCount = healCount === 0 ? 2 : random.next() < 0.5 ? 1 : 2;
  const surviveCount = 4 - healCount - attackCount;
  const outcomes: BossDodgeOutcome[] = [
    ...Array<BossDodgeOutcome>(attackCount).fill("attack"),
    ...Array<BossDodgeOutcome>(surviveCount).fill("survive"),
    ...Array<BossDodgeOutcome>(healCount).fill("heal"),
  ];

  for (let index = outcomes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    [outcomes[index], outcomes[swapIndex]] = [outcomes[swapIndex], outcomes[index]];
  }

  return Object.fromEntries(
    BOSS_DODGE_DIRECTIONS.map((direction, index) => [direction, outcomes[index]]),
  ) as BossDodgeBoard;
}

export function runBossCombatControllerChecks(): void {
  for (let index = 0; index < 100; index += 1) {
    const board = createBossDodgeBoard(`boss-dodge-check-${index}`);
    const values = Object.values(board);
    const attacks = values.filter((value) => value === "attack").length;
    const survives = values.filter((value) => value === "survive").length;
    const heals = values.filter((value) => value === "heal").length;
    if (
      values.length !== 4 ||
      attacks < 1 || attacks > 2 ||
      survives < 1 || survives > 2 ||
      heals < 0 || heals > 1
    ) {
      throw new Error("[BossCombatController] invalid dodge board");
    }
  }
}
