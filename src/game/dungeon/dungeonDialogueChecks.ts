import {
  dungeonDialogue,
  hasFinalConsonant,
  withObjectParticle,
  withSubjectParticle,
} from "./dungeonDialogue";

const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`[dungeon dialogue checks] ${message}`);
};

export function runDungeonDialogueChecks() {
  check(hasFinalConsonant("동굴곰"), "detects a final consonant");
  check(!hasFinalConsonant("멧돼지"), "detects no final consonant");
  check(withSubjectParticle("멧돼지") === "멧돼지가", "subject particle after vowel");
  check(withSubjectParticle("동굴곰") === "동굴곰이", "subject particle after consonant");
  check(withObjectParticle("매머드") === "매머드를", "object particle after vowel");
  check(dungeonDialogue.swingSword("백란") === "백란이 검을 휘두른다!", "player subject sentence");
  check(dungeonDialogue.encounter("매머드", true) === "정예 몬스터, 매머드가 나타났다!", "elite encounter sentence");
  check(dungeonDialogue.stunned("동굴곰") === "동굴곰은 기절해서 움직일 수 없다!", "topic particle after consonant");
  check(dungeonDialogue.usedItem("백란", "소형 회복 물약") === "백란은 소형 회복 물약을 사용했다.", "actor and item particles");
  console.info("dungeon dialogue checks: PASS");
}
