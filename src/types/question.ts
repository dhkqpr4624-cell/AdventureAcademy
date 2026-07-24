type QuestionCommon = {
  id: string;
  lessonId: string;
  prompt: string;
  imageUrl?: string;
  explanation: string;
  difficulty?: 1 | 2 | 3;
  tags?: string[];
};

export type MultipleChoiceQuestion = QuestionCommon & {
  type: "multipleChoice";
  options: string[];
  correctAnswer: string;
};

export type TrueFalseQuestion = QuestionCommon & {
  type: "trueFalse";
  correctAnswer: boolean;
};

export type MultipleSelectQuestion = QuestionCommon & {
  type: "multipleSelect";
  options: string[];
  correctAnswers: string[];
};

export type ShortAnswerQuestion = QuestionCommon & {
  type: "shortAnswer";
  acceptedAnswers: string[];
};

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MultipleSelectQuestion
  | ShortAnswerQuestion;

export type SubmittedAnswer = string | boolean | string[];

export type QuestionResult = {
  questionId: string;
  isCorrect: boolean;
};
