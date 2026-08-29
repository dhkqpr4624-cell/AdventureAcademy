import { FLOOR1_PREHISTORY_QUESTIONS, FLOOR2_GOJOSEON_QUESTIONS } from "../../data/testQuestions";
import type { Question } from "../../types/question";
import { gradeQuestion } from "./questionGrading";

function question(id: string): Question {
  const found = [...FLOOR1_PREHISTORY_QUESTIONS, ...FLOOR2_GOJOSEON_QUESTIONS].find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing grading fixture: ${id}`);
  }
  return found;
}

export function runQuestionGradingChecks() {
  const checks: Array<[string, boolean]> = [
    ["객관식 정답", gradeQuestion(question("floor2-gojoseon-mc-04"), "지배층의 무기와 제사 도구")],
    ["객관식 오답", !gradeQuestion(question("floor2-gojoseon-mc-04"), "농사를 짓는 농기구")],
    ["OX 정답", gradeQuestion(question("floor1-prehistory-tf-10"), true)],
    ["OX 오답", !gradeQuestion(question("floor1-prehistory-tf-10"), false)],
    [
      "복수정답 순서 무관",
      gradeQuestion(question("floor2-gojoseon-ms-09"), ["탁자식 고인돌", "비파형 동검"]),
    ],
    [
      "복수정답 일부 선택은 오답",
      !gradeQuestion(question("floor2-gojoseon-ms-09"), ["비파형 동검"]),
    ],
    [
      "복수정답에 오답 추가는 오답",
      !gradeQuestion(question("floor2-gojoseon-ms-09"), ["비파형 동검", "탁자식 고인돌", "빗살무늬토기"]),
    ],
    [
      "단답형 앞뒤·연속 공백 및 띄어쓰기 제거",
      gradeQuestion(question("floor1-prehistory-short-11"), " 빗살무늬   토기 "),
    ],
  ];

  const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length > 0) {
    throw new Error(`Question grading checks failed: ${failed.join(", ")}`);
  }

  return checks.map(([name]) => name);
}
