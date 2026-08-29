import type {
  Question,
  ShortAnswerQuestion,
  SubmittedAnswer,
} from "../../types/question";

export type NormalizedShortAnswer = {
  collapsed: string;
  withoutSpaces: string;
};

export function normalizeShortAnswer(value: string): NormalizedShortAnswer {
  const collapsed = value
    .normalize("NFKC")
    .replace(/\p{White_Space}+/gu, " ")
    .trim()
    .toLocaleLowerCase("ko-KR");

  return {
    collapsed,
    withoutSpaces: collapsed.replace(/[\p{White_Space}\p{Punctuation}]+/gu, ""),
  };
}

export function isAcceptedShortAnswer(
  question: ShortAnswerQuestion,
  submitted: string,
): boolean {
  const normalizedSubmitted = normalizeShortAnswer(submitted);

  return question.acceptedAnswers.some((accepted) => {
    const normalizedAccepted = normalizeShortAnswer(accepted);
    return (
      normalizedSubmitted.collapsed === normalizedAccepted.collapsed ||
      normalizedSubmitted.withoutSpaces === normalizedAccepted.withoutSpaces
    );
  });
}

function sameStringSet(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  return leftSet.size === right.length && right.every((value) => leftSet.has(value));
}

export function gradeQuestion(
  question: Question,
  submittedAnswer: SubmittedAnswer,
): boolean {
  switch (question.type) {
    case "multipleChoice":
      return (
        typeof submittedAnswer === "string" &&
        submittedAnswer === question.correctAnswer
      );
    case "trueFalse":
      return (
        typeof submittedAnswer === "boolean" &&
        submittedAnswer === question.correctAnswer
      );
    case "multipleSelect":
      return (
        Array.isArray(submittedAnswer) &&
        sameStringSet(submittedAnswer, question.correctAnswers)
      );
    case "shortAnswer":
      return (
        typeof submittedAnswer === "string" &&
        isAcceptedShortAnswer(question, submittedAnswer)
      );
  }
}
