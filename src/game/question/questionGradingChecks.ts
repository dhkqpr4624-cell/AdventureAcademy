import { FLOOR1_PREHISTORY_QUESTIONS, FLOOR2_GOJOSEON_QUESTIONS } from "../../data/testQuestions";
import type { Question, ShortAnswerQuestion } from "../../types/question";
import { gradeQuestion } from "./questionGrading";

function question(id: string): Question {
  const found = [...FLOOR1_PREHISTORY_QUESTIONS, ...FLOOR2_GOJOSEON_QUESTIONS].find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing grading fixture: ${id}`);
  }
  return found;
}

export function runQuestionGradingChecks() {
  const shortFixture = (id: string, acceptedAnswers: string[]): ShortAnswerQuestion => ({
    id,
    lessonId: "normalization-check",
    type: "shortAnswer",
    prompt: id,
    acceptedAnswers,
    explanation: "정규화 검사",
  });
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
    ["단답형 Unicode·전각·구두점 정규화", gradeQuestion(shortFixture("광개토", ["광개토 대왕"]), "  광개토대왕！")],
    ["당 별칭", gradeQuestion(shortFixture("당", ["당", "당나라"]), "당나라.")],
    ["위례성 별칭", gradeQuestion(shortFixture("위례성", ["위례성(한성)", "위례성", "한성"]), "한성!")],
    ["웅진 별칭", gradeQuestion(shortFixture("웅진", ["웅진(공주)", "웅진", "공주"]), "웅진 (공주)")],
    ["사비 별칭", gradeQuestion(shortFixture("사비", ["사비(부여)", "사비", "부여"]), "부여")],
    ["후삼국 별칭", gradeQuestion(shortFixture("후삼국", ["후삼국 시대", "후삼국"]), "후삼국시대")],
    ["후고구려 별칭", gradeQuestion(shortFixture("후고구려", ["후고구려(태봉)", "후고구려", "태봉"]), "태봉")],
    ["혼인 별칭", gradeQuestion(shortFixture("혼인", ["혼인(결혼)", "혼인", "결혼"]), "결혼")],
    ["직지 별칭", gradeQuestion(shortFixture("직지", ["직지", "직지심체요절"]), "직지심체요절!")],
    ["청자 별칭", gradeQuestion(shortFixture("청자", ["청자", "고려청자"]), "고려 청자")],
  ];

  const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length > 0) {
    throw new Error(`Question grading checks failed: ${failed.join(", ")}`);
  }

  return checks.map(([name]) => name);
}
