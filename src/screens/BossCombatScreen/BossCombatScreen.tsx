import { useEffect, useMemo, useRef, useState } from "react";
import type { ScreenId } from "../../app/routes";
import { CombatDialoguePanel } from "../../components/combat/CombatDialoguePanel";
import { PlayerStatusBar } from "../../components/PlayerStatusBar";
import {
  BOSS_DODGE_DIRECTIONS,
  BOSS_DODGE_HEAL_AMOUNT,
  BOSS_DODGE_LABELS,
  BOSS_DODGE_OUTCOME_LABELS,
  createBossDodgeBoard,
  runBossCombatControllerChecks,
  type BossDodgeBoard,
  type BossDodgeDirection,
} from "../../game/bossCombat/BossCombatController";
import {
  BOSS_QUIZ_QUESTION_COUNT,
  createBossQuizQuestions,
} from "../../game/bossCombat/BossQuizFlow";
import type { PlayerState } from "../../game/player/playerState";
import type { QuestionResult } from "../../types/question";
import { QuestionScreen } from "../QuestionScreen/QuestionScreen";
import "./BossCombatScreen.css";

type BossCombatPhase =
  | "question"
  | "resolving"
  | "dodgeChoice"
  | "dodgeResult"
  | "complete";

type BossCombatScreenProps = {
  seed: string;
  playerState: PlayerState;
  onNavigate: (screen: ScreenId) => void;
  onPlayerAttack: () => Promise<void>;
  onBossAttack: () => Promise<void>;
  onHeal: (amount: number) => Promise<void>;
  onComplete?: () => void;
};

export function BossCombatScreen({
  seed,
  playerState,
  onNavigate,
  onPlayerAttack,
  onBossAttack,
  onHeal,
  onComplete,
}: BossCombatScreenProps) {
  const questions = useMemo(() => createBossQuizQuestions(seed), [seed]);
  const pendingResultRef = useRef<QuestionResult | null>(null);
  const resolvingRef = useRef(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<BossCombatPhase>("question");
  const [selectedDirection, setSelectedDirection] =
    useState<BossDodgeDirection | null>(null);
  const [dodgeBoard, setDodgeBoard] = useState<BossDodgeBoard | null>(null);
  const [outcomeApplied, setOutcomeApplied] = useState(false);
  const [healEffectVisible, setHealEffectVisible] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) runBossCombatControllerChecks();
  }, []);

  const advanceQuestion = () => {
    pendingResultRef.current = null;
    setSelectedDirection(null);
    setDodgeBoard(null);
    setOutcomeApplied(false);
    if (questionIndex + 1 >= BOSS_QUIZ_QUESTION_COUNT) {
      setPhase("complete");
      onComplete?.();
      return;
    }
    setQuestionIndex((current) => current + 1);
    setPhase("question");
  };

  const completeQuestionReview = async () => {
    if (resolvingRef.current || !pendingResultRef.current) return;
    resolvingRef.current = true;
    setPhase("resolving");
    try {
      if (!pendingResultRef.current.isCorrect) {
        await onBossAttack();
        advanceQuestion();
        return;
      }
      await onPlayerAttack();
      setDodgeBoard(
        createBossDodgeBoard(`${seed}::dodge-turn-${questionIndex}`),
      );
      setPhase("dodgeChoice");
    } finally {
      resolvingRef.current = false;
    }
  };

  const revealDodgeResult = async () => {
    if (resolvingRef.current || !selectedDirection || !dodgeBoard) return;
    resolvingRef.current = true;
    setOutcomeApplied(false);
    setPhase("dodgeResult");
    try {
      const outcome = dodgeBoard[selectedDirection];
      if (outcome === "attack") await onBossAttack();
      if (outcome === "heal") {
        await onHeal(BOSS_DODGE_HEAL_AMOUNT);
        setHealEffectVisible(true);
        window.setTimeout(() => setHealEffectVisible(false), 300);
      }
    } finally {
      resolvingRef.current = false;
      setOutcomeApplied(true);
    }
  };

  const statusBar = (
    <PlayerStatusBar
      {...playerState}
      questionLabel={`${Math.min(questionIndex + 1, BOSS_QUIZ_QUESTION_COUNT)} / ${BOSS_QUIZ_QUESTION_COUNT}`}
    />
  );

  if (phase === "question") {
    return (
      <section className="boss-combat-layer" aria-label="Dungeon10 보스 전투">
        <header className="boss-combat-hud">
          <p className="eyebrow">BOSS COMBAT</p>
          <h1>뒤틀린 문명의 골렘</h1>
          <small>15개의 문제를 해결하라</small>
        </header>
        <CombatDialoguePanel mode="question" statusBar={statusBar}>
          <QuestionScreen
            key={`boss-question-${questions[questionIndex].id}`}
            embedded
            eyebrow={`BOSS QUESTION ${questionIndex + 1}`}
            questions={[questions[questionIndex]]}
            onNavigate={onNavigate}
            onReviewChange={(result) => {
              pendingResultRef.current = result;
            }}
            onResult={(result) => {
              pendingResultRef.current = result;
            }}
            onComplete={() => void completeQuestionReview()}
          />
        </CombatDialoguePanel>
      </section>
    );
  }

  return (
    <section className="boss-combat-layer" aria-label="Dungeon10 보스 전투">
      {healEffectVisible && (
        <strong className="combat-floating-text is-heal">+15</strong>
      )}
      <header className="boss-combat-hud">
        <p className="eyebrow">BOSS COMBAT</p>
        <h1>뒤틀린 문명의 골렘</h1>
        <small>{phase === "complete" ? "전투 종료" : "공격 중"}</small>
      </header>
      <CombatDialoguePanel
        mode={phase === "complete" ? "result" : "message"}
        statusBar={statusBar}
        busy={phase === "resolving" || resolvingRef.current}
      >
        {phase === "resolving" && (
          <div className="combat-message-layout">
            <p className="combat-message" role="status">공격이 이어진다!</p>
          </div>
        )}

        {(phase === "dodgeChoice" || phase === "dodgeResult") && dodgeBoard && (
          <div className="boss-dodge-panel">
            <p className="combat-message" role="status">
              보스가 공격하려고 한다!<br />어디로 피할까?
            </p>
            <div className="boss-dodge-grid" aria-label="회피 방향 선택">
              {BOSS_DODGE_DIRECTIONS.map((direction) => {
                const selected = selectedDirection === direction;
                const revealed = phase === "dodgeResult";
                const outcome = dodgeBoard[direction];
                return (
                  <button
                    key={direction}
                    type="button"
                    className={`boss-dodge-button ${selected ? "is-selected" : ""} ${revealed ? `is-${outcome}` : ""}`}
                    aria-pressed={selected}
                    disabled={revealed}
                    onClick={() => setSelectedDirection(direction)}
                  >
                    <span>{BOSS_DODGE_LABELS[direction]}</span>
                    {revealed && <strong>{BOSS_DODGE_OUTCOME_LABELS[outcome]}</strong>}
                  </button>
                );
              })}
            </div>
            {phase === "dodgeChoice" ? (
              <button
                type="button"
                className="combat-message-next"
                disabled={!selectedDirection}
                onClick={() => void revealDodgeResult()}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className="combat-message-next"
                disabled={!outcomeApplied}
                onClick={advanceQuestion}
              >
                다음 문제
              </button>
            )}
          </div>
        )}

        {phase === "complete" && (
          <div className="combat-result-card" role="status">
            <p className="eyebrow">BOSS COMBAT COMPLETE</p>
            <h2>15개의 문제를 모두 종료했다.</h2>
            <p>BossCombat 종료 상태입니다.</p>
          </div>
        )}
      </CombatDialoguePanel>
    </section>
  );
}
