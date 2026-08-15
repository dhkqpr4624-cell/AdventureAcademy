import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";

export function runStoryChoiceChecks() {
  for (const id of ["npc-theo-default", "npc-theo-floor-5-quest-active"]) {
    const theoSteps = NPC_STORY_SEQUENCES[id].scenes.flatMap((scene) => scene.steps);
    const choice = theoSteps.find((step) => step.type === "choice");
    if (!choice || choice.options.map((option) => option.label).join("|") !== "아이템 사기|대화 끝내기") {
      throw new Error(`[story choice checks] Theo choices are missing in ${id}.`);
    }
    const shopChoice = choice.options.find((option) => option.id === "buy-items");
    if (!shopChoice || shopChoice.actionId !== "open-theo-shop") {
      throw new Error(`[story choice checks] Theo shop action is missing in ${id}.`);
    }
  }
  for (const id of ["npc-luna-default", "npc-kaiden-default"]) {
    if (NPC_STORY_SEQUENCES[id].scenes.some((scene) => scene.steps.some((step) => step.type === "choice"))) {
      throw new Error(`[story choice checks] Unexpected choice in ${id}.`);
    }
  }
}
