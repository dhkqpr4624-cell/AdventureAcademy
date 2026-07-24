import { TEST_QUESTIONS } from "../../data/testQuestions";
import type { Question } from "../../types/question";
import { gradeQuestion } from "./questionGrading";

function question(id: string): Question {
  const found = TEST_QUESTIONS.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing grading fixture: ${id}`);
  }
  return found;
}

export function runQuestionGradingChecks() {
  const checks: Array<[string, boolean]> = [
    ["객관식 정답", gradeQuestion(question("test-mc-01"), "서울")],
    ["객관식 오답", !gradeQuestion(question("test-mc-01"), "부산")],
    ["OX 정답", gradeQuestion(question("test-tf-01"), true)],
    ["OX 오답", !gradeQuestion(question("test-tf-01"), false)],
    [
      "복수정답 순서 무관",
      gradeQuestion(question("test-ms-01"), ["박쥐", "고래"]),
    ],
    [
      "복수정답 일부 선택은 오답",
      !gradeQuestion(question("test-ms-01"), ["고래"]),
    ],
    [
      "복수정답에 오답 추가는 오답",
      !gradeQuestion(question("test-ms-01"), ["고래", "박쥐", "참새"]),
    ],
    [
      "단답형 앞뒤·연속 공백 및 띄어쓰기 제거",
      gradeQuestion(question("test-short-01"), " 광개토   대왕 "),
    ],
    ["영문 대소문자 무시", gradeQuestion(question("test-short-02"), "eArTh")],
  ];

  const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length > 0) {
    throw new Error(`Question grading checks failed: ${failed.join(", ")}`);
  }

  return checks.map(([name]) => name);
}
