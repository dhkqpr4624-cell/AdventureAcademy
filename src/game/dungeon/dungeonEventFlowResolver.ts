export type DungeonEventFlowPhase =
  | "treasurePrompt"
  | "trapIntroFloor"
  | "trapIntroReveal"
  | "trapIntroChallenge"
  | "question"
  | "review"
  | "result";

export type DungeonEventFlowStep = {
  phase: DungeonEventFlowPhase;
  message?: string;
  visual: "none" | "treasureClosed" | "trapIdle";
  startsQuestion: boolean;
};

export function getTreasurePromptStep(): DungeonEventFlowStep {
  return {
    phase: "treasurePrompt",
    message: "닫힌 보물상자가 놓여 있다.",
    visual: "treasureClosed",
    startsQuestion: false,
  };
}

export function getTrapIntroStep(
  phase: Extract<
    DungeonEventFlowPhase,
    "trapIntroFloor" | "trapIntroReveal" | "trapIntroChallenge"
  >,
): DungeonEventFlowStep {
  switch (phase) {
    case "trapIntroFloor":
      return {
        phase,
        message: "밟고 있는 바닥이 덜컥이더니 갑자기 쑤욱 들어간다.",
        visual: "none",
        startsQuestion: false,
      };
    case "trapIntroReveal":
      return {
        phase,
        message: "이런, 함정 스위치를 밟았다.",
        visual: "trapIdle",
        startsQuestion: false,
      };
    case "trapIntroChallenge":
      return {
        phase,
        message: "문제를 해결하여 함정에서 벗어나자.",
        visual: "trapIdle",
        startsQuestion: false,
      };
  }
}

export function advanceTrapIntro(
  phase: DungeonEventFlowPhase,
): DungeonEventFlowStep {
  switch (phase) {
    case "trapIntroFloor":
      return getTrapIntroStep("trapIntroReveal");
    case "trapIntroReveal":
      return getTrapIntroStep("trapIntroChallenge");
    case "trapIntroChallenge":
      return {
        phase: "question",
        visual: "trapIdle",
        startsQuestion: true,
      };
    default:
      throw new Error(`[dungeonEventFlowResolver] Cannot advance ${phase}`);
  }
}
