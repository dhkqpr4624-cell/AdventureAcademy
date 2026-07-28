import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";

export function runStoryChoiceChecks() {
  const theoSteps = NPC_STORY_SEQUENCES["npc-theo-default"].scenes.flatMap((scene) => scene.steps);
  const choice = theoSteps.find((step) => step.type === "choice");
  if (!choice || choice.options.map((option) => option.label).join("|") !== "아이템 사기|대화 끝내기") {
    throw new Error("[story choice checks] Theo choices are missing.");
  }
  if (!theoSteps.some((step) => step.type === "dialogue" && step.text === "상점은 아직 준비 중입니다.")) {
    throw new Error("[story choice checks] Shop pending dialogue is missing.");
  }
  for (const id of ["npc-luna-default", "npc-kaiden-default"]) {
    if (NPC_STORY_SEQUENCES[id].scenes.some((scene) => scene.steps.some((step) => step.type === "choice"))) {
      throw new Error(`[story choice checks] Unexpected choice in ${id}.`);
    }
  }
}
