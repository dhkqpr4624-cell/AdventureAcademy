import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ScreenId } from "../../app/routes";
import { TEST_QUESTIONS } from "../../data/testQuestions";
import { gradeQuestion } from "../../game/question/questionGrading";
import { runQuestionGradingChecks } from "../../game/question/questionGradingChecks";
import type {
  Question,
  QuestionResult,
  SubmittedAnswer,
} from "../../types/question";

type QuestionScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  onResult: (result: QuestionResult) => void;
  questions?: readonly Question[];
  onComplete?: () => void;
  embedded?: boolean;
  eyebrow?: string;
  onReviewChange?: (result: QuestionResult) => void;
};

function questionTypeLabel(question: Question) {
  switch (question.type) {
    case "multipleChoice":
      return "객관식";
    case "trueFalse":
      return "OX";
    case "multipleSelect":
      return "복수 선택";
    case "shortAnswer":
      return "단답형";
  }
}

function resolveImageUrl(imageUrl: string) {
  if (/^(?:https?:|data:|blob:)/.test(imageUrl)) {
    return imageUrl;
  }
  return `${import.meta.env.BASE_URL}${imageUrl.replace(/^\/+/, "")}`;
}

function answerText(answer: SubmittedAnswer) {
  if (typeof answer === "boolean") {
    return answer ? "O" : "X";
  }
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  return answer;
}

function OptionButton({
  label,
  selected,
  submitted,
  correct,
  onClick,
}: {
  label: string;
  selected: boolean;
  submitted: boolean;
  correct: boolean;
  onClick: () => void;
}) {
  const statusClass = !submitted
    ? ""
    : correct
      ? selected
        ? "is-correct is-selected"
        : "is-correct is-missed"
      : selected
        ? "is-wrong is-selected"
        : "";

  return (
    <button
      type="button"
      className={`question-option ${selected ? "is-selected" : ""} ${statusClass}`}
      aria-pressed={selected}
      disabled={submitted}
      onClick={onClick}
    >
      <span className="question-option-marker" aria-hidden="true" />
      <span>{label}</span>
      {submitted && correct && <small>정답</small>}
      {submitted && selected && !correct && <small>선택한 오답</small>}
      {submitted && correct && !selected && <small>놓친 정답</small>}
    </button>
  );
}

function QuestionReviewFooter({
  explanation,
  isSubmitted,
  onNext,
}: {
  explanation: string;
  isSubmitted: boolean;
  onNext: () => void;
}) {
  return (
    <footer className={`question-footer ${isSubmitted ? "is-review" : ""}`}>
      {isSubmitted ? (
        <div className="question-review-explanation">
          <strong>해설</strong>
          <p>{explanation}</p>
        </div>
      ) : (
        <span>답을 고른 뒤 제출하세요.</span>
      )}
      {isSubmitted && (
        <button type="button" onClick={onNext}>
          다음으로
        </button>
      )}
    </footer>
  );
}

export function QuestionScreen({
  onNavigate,
  onResult,
  questions = TEST_QUESTIONS,
  onComplete,
  embedded = false,
  eyebrow = "QUESTION TEST",
  onReviewChange,
}: QuestionScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [shortAnswer, setShortAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] =
    useState<SubmittedAnswer | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const submitLockRef = useRef(false);
  const nextLockRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      runQuestionGradingChecks();
    }
  }, []);

  const question = questions[questionIndex];
  const isSubmitted = submittedAnswer !== null;

  const currentAnswer = (): SubmittedAnswer | null => {
    switch (question.type) {
      case "multipleChoice":
        return selectedSingle;
      case "trueFalse":
        return selectedSingle === null ? null : selectedSingle === "true";
      case "multipleSelect":
        return selectedMultiple.size > 0 ? [...selectedMultiple] : null;
      case "shortAnswer":
        return shortAnswer.trim() ? shortAnswer : null;
    }
  };

  const canSubmit = !isSubmitted && currentAnswer() !== null;

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (submitLockRef.current || isSubmitted) {
      return;
    }

    const answer = currentAnswer();
    if (answer === null) {
      return;
    }

    submitLockRef.current = true;
    const correct = gradeQuestion(question, answer);
    setSubmittedAnswer(answer);
    setIsCorrect(correct);
    onReviewChange?.({ questionId: question.id, isCorrect: correct });
  };

  const moveNext = () => {
    if (
      nextLockRef.current ||
      submittedAnswer === null ||
      isCorrect === null
    ) {
      return;
    }

    nextLockRef.current = true;
    onResult({ questionId: question.id, isCorrect });

    if (questionIndex === questions.length - 1) {
      if (onComplete) {
        onComplete();
        return;
      }
      setIsComplete(true);
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSelectedSingle(null);
    setSelectedMultiple(new Set());
    setShortAnswer("");
    setSubmittedAnswer(null);
    setIsCorrect(null);
    setImageFailed(false);
    submitLockRef.current = false;
    requestAnimationFrame(() => {
      nextLockRef.current = false;
    });
  };

  if (isComplete) {
    return (
      <main className="game-screen question-screen">
        <section className="question-complete-card">
          <p className="eyebrow">QUESTION TEST COMPLETE</p>
          <h1>퀴즈 테스트 완료</h1>
          <p>8개의 테스트 문제를 모두 확인했습니다.</p>
          <div className="button-group">
            <button type="button" onClick={() => onNavigate("title")}>
              타이틀로 돌아가기
            </button>
          </div>
        </section>
      </main>
    );
  }

  const toggleMultiple = (option: string) => {
    if (isSubmitted) {
      return;
    }
    setSelectedMultiple((current) => {
      const next = new Set(current);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const correctOptions =
    question.type === "multipleChoice"
      ? [question.correctAnswer]
      : question.type === "multipleSelect"
        ? question.correctAnswers
        : [];

  const content = (
    <>
      <section className="question-card" aria-labelledby="question-prompt">
        <header className="question-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <span className="question-type">{questionTypeLabel(question)}</span>
          </div>
          <strong>
            {questionIndex + 1} / {questions.length}
          </strong>
        </header>

        <div className="question-scroll-area">
          <h1 id="question-prompt">{question.prompt}</h1>

          {question.imageUrl && (
            <div className="question-image-area">
              {!imageFailed ? (
                <img
                  src={resolveImageUrl(question.imageUrl)}
                  alt="문제 참고 자료"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <p role="status">문제 이미지를 불러오지 못했습니다.</p>
              )}
            </div>
          )}

          <form onSubmit={submit}>
            {(question.type === "multipleChoice" ||
              question.type === "multipleSelect") && (
              <div className="question-options">
                {question.options.map((option) => (
                  <OptionButton
                    key={option}
                    label={option}
                    selected={
                      question.type === "multipleChoice"
                        ? selectedSingle === option
                        : selectedMultiple.has(option)
                    }
                    submitted={isSubmitted}
                    correct={correctOptions.includes(option)}
                    onClick={() => {
                      if (question.type === "multipleChoice") {
                        setSelectedSingle(option);
                      } else {
                        toggleMultiple(option);
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {question.type === "trueFalse" && (
              <div className="question-options question-true-false">
                {[
                  { value: "true", label: "O", correct: question.correctAnswer },
                  { value: "false", label: "X", correct: !question.correctAnswer },
                ].map((option) => (
                  <OptionButton
                    key={option.value}
                    label={option.label}
                    selected={selectedSingle === option.value}
                    submitted={isSubmitted}
                    correct={option.correct}
                    onClick={() => setSelectedSingle(option.value)}
                  />
                ))}
              </div>
            )}

            {question.type === "shortAnswer" && (
              <label className="question-short-answer">
                <span>답 입력</span>
                <input
                  type="text"
                  value={shortAnswer}
                  readOnly={isSubmitted}
                  disabled={isSubmitted}
                  autoComplete="off"
                  placeholder="한 줄로 입력하세요"
                  onChange={(event) => setShortAnswer(event.target.value)}
                />
              </label>
            )}

            {!isSubmitted && (
              <button
                type="submit"
                className="question-submit-button"
                disabled={!canSubmit}
              >
                답 제출
              </button>
            )}
          </form>

          {isSubmitted && isCorrect !== null && (
            <section
              className={`question-feedback ${isCorrect ? "is-correct" : "is-wrong"}`}
              aria-live="polite"
            >
              <h2>{isCorrect ? "정답입니다!" : "오답입니다."}</h2>
              <dl>
                <div>
                  <dt>내가 제출한 답</dt>
                  <dd>{answerText(submittedAnswer)}</dd>
                </div>
                <div>
                  <dt>정답</dt>
                  <dd>
                    {question.type === "trueFalse"
                      ? question.correctAnswer
                        ? "O"
                        : "X"
                      : question.type === "multipleSelect"
                        ? question.correctAnswers.join(", ")
                        : question.type === "shortAnswer"
                          ? question.acceptedAnswers[0]
                          : question.correctAnswer}
                  </dd>
                </div>
              </dl>
              {question.type === "shortAnswer" &&
                question.acceptedAnswers.length > 1 && (
                  <p className="question-other-answers">
                    그 밖의 인정 답안:{" "}
                    {question.acceptedAnswers.slice(1).join(", ")}
                  </p>
                )}
            </section>
          )}
        </div>

        <QuestionReviewFooter
          explanation={question.explanation}
          isSubmitted={isSubmitted}
          onNext={moveNext}
        />
      </section>
    </>
  );

  if (embedded) {
    return <div className="question-screen is-embedded">{content}</div>;
  }

  return (
    <main
      className={`game-screen question-screen ${embedded ? "is-embedded" : ""}`}
    >
      {content}
    </main>
  );
}
