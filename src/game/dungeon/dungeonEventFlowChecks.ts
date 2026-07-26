import {
  advanceTrapIntro,
  getTrapIntroStep,
  getTreasurePromptStep,
} from "./dungeonEventFlowResolver";

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[dungeonEventFlowChecks] ${message}`);
  }
}

export function runDungeonEventFlowChecks(): void {
  const treasure = getTreasurePromptStep();
  check(!treasure.startsQuestion, "treasure entry must not start a question");
  check(treasure.visual === "treasureClosed", "treasure prompt keeps chest closed");

  const first = getTrapIntroStep("trapIntroFloor");
  const second = advanceTrapIntro(first.phase);
  const third = advanceTrapIntro(second.phase);
  const question = advanceTrapIntro(third.phase);
  check(first.visual === "none", "trap first intro hides the trap image");
  check(second.phase === "trapIntroReveal", "trap second intro reveals the switch");
  check(second.visual === "trapIdle", "trap reveal uses idle image");
  check(third.phase === "trapIntroChallenge", "trap intro has a third dialogue");
  check(!first.startsQuestion && !second.startsQuestion && !third.startsQuestion,
    "trap intro must not start the question");
  check(question.phase === "question" && question.startsQuestion,
    "only the third next starts the trap question");
  console.info("dungeon event flow checks: PASS");
}
