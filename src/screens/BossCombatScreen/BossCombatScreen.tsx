import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ScreenId } from "../../app/routes";
import { CombatDialoguePanel } from "../../components/combat/CombatDialoguePanel";
import { ItemIcon } from "../../components/ItemIcon";
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
import {
  getPotionHealAmount,
  resolvePotionUse,
  type PotionKind,
} from "../../game/combat/potionResolver";
import { getItemDefinition } from "../../game/inventory/itemDefinitions";
import {
  changeItemQuantity,
  getItemQuantity,
  type InventoryState,
} from "../../game/inventory/inventoryState";
import type { PlayerState } from "../../game/player/playerState";
import type { QuestionResult } from "../../types/question";
import { QuestionScreen } from "../QuestionScreen/QuestionScreen";
import "./BossCombatScreen.css";

type BossCombatPhase =
  | "command"
  | "itemSelect"
  | "itemConfirm"
  | "question"
  | "resolving"
  | "dodgeChoice"
  | "dodgeResult"
  | "supportPrelude"
  | "support"
  | "gameOver"
  | "complete";

type SupportNpc = {
  name: "루나" | "카이든" | "테오";
  subject: string;
  imageUrl: string;
};

const SUPPORT_NPCS: readonly SupportNpc[] = [
  { name: "루나", subject: "루나가", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon10/support/luna-support.png` },
  { name: "카이든", subject: "카이든이", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon10/support/kaiden-support.png` },
  { name: "테오", subject: "테오가", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon10/support/theo-support.png` },
];

type BossCombatScreenProps = {
  seed: string;
  playerState: PlayerState;
  onNavigate: (screen: ScreenId) => void;
  onPlayerAttack: () => Promise<void>;
  onBossAttack: () => Promise<{ isDefeated: boolean }>;
  onHeal: (amount: number) => Promise<void>;
  inventoryState: InventoryState;
  setInventoryState: Dispatch<SetStateAction<InventoryState>>;
  onInventoryChanged: () => void;
  onGameOver: () => void;
  onComplete?: () => void;
};

export function BossCombatScreen({
  seed,
  playerState,
  onNavigate,
  onPlayerAttack,
  onBossAttack,
  onHeal,
  inventoryState,
  setInventoryState,
  onInventoryChanged,
  onGameOver,
  onComplete,
}: BossCombatScreenProps) {
  const questions = useMemo(() => createBossQuizQuestions(seed), [seed]);
  const pendingResultRef = useRef<QuestionResult | null>(null);
  const resolvingRef = useRef(false);
  const supportCountRef = useRef(0);
  const supportContinuationRef = useRef<(() => void) | null>(null);
  const supportTimerRef = useRef<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<BossCombatPhase>("command");
  const [selectedDirection, setSelectedDirection] =
    useState<BossDodgeDirection | null>(null);
  const [dodgeBoard, setDodgeBoard] = useState<BossDodgeBoard | null>(null);
  const [applyingDodgeResult, setApplyingDodgeResult] = useState(false);
  const [healEffectText, setHealEffectText] = useState<string | null>(null);
  const [selectedPotion, setSelectedPotion] = useState<PotionKind | null>(null);
  const [supportNpc, setSupportNpc] = useState<SupportNpc | null>(null);
  const [supportReady, setSupportReady] = useState(false);
  const [supportExiting, setSupportExiting] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) runBossCombatControllerChecks();
    return () => {
      if (supportTimerRef.current !== null) window.clearTimeout(supportTimerRef.current);
    };
  }, []);

  const advanceQuestion = () => {
    pendingResultRef.current = null;
    setSelectedDirection(null);
    setDodgeBoard(null);
    setApplyingDodgeResult(false);
    if (questionIndex + 1 >= BOSS_QUIZ_QUESTION_COUNT) {
      setPhase("complete");
      onComplete?.();
      return;
    }
    setQuestionIndex((current) => current + 1);
    setPhase("command");
  };

  const beginNpcSupport = (continuation: () => void) => {
    if (supportCountRef.current >= 2) {
      setPhase("gameOver");
      onGameOver();
      return;
    }
    supportCountRef.current += 1;
    supportContinuationRef.current = continuation;
    const selected = SUPPORT_NPCS[Math.floor(Math.random() * SUPPORT_NPCS.length)];
    setSupportNpc(selected);
    setSupportReady(false);
    setSupportExiting(false);
    setPhase("supportPrelude");
  };

  const startNpcSupportCutin = () => {
    if (!supportNpc) return;
    setSupportReady(false);
    setSupportExiting(false);
    setPhase("support");
    supportTimerRef.current = window.setTimeout(() => {
      setSupportReady(true);
      supportTimerRef.current = null;
    }, 350);
  };

  const resolveBossAttack = async (continuation: () => void) => {
    const result = await onBossAttack();
    if (result.isDefeated) {
      beginNpcSupport(continuation);
      return;
    }
    continuation();
  };

  const completeQuestionReview = async () => {
    if (resolvingRef.current || !pendingResultRef.current) return;
    resolvingRef.current = true;
    setPhase("resolving");
    try {
      if (!pendingResultRef.current.isCorrect) {
        await resolveBossAttack(advanceQuestion);
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

  const revealDodgeResult = () => {
    if (!selectedDirection || !dodgeBoard) return;
    setPhase("dodgeResult");
  };

  const applyDodgeResult = async () => {
    if (resolvingRef.current || !selectedDirection || !dodgeBoard) return;
    resolvingRef.current = true;
    setApplyingDodgeResult(true);
    let supportInterrupted = false;
    try {
      const outcome = dodgeBoard[selectedDirection];
      if (outcome === "attack") {
        const result = await onBossAttack();
        if (result.isDefeated) {
          supportInterrupted = true;
          beginNpcSupport(advanceQuestion);
        }
      }
      if (outcome === "heal") {
        await onHeal(BOSS_DODGE_HEAL_AMOUNT);
        setHealEffectText("+15");
        window.setTimeout(() => setHealEffectText(null), 300);
      }
    } finally {
      resolvingRef.current = false;
      setApplyingDodgeResult(false);
    }
    if (!supportInterrupted) advanceQuestion();
  };

  const finishNpcSupport = () => {
    if (!supportNpc || supportExiting) return;
    setSupportReady(false);
    setSupportExiting(true);
    supportTimerRef.current = window.setTimeout(() => {
      supportTimerRef.current = null;
      void onHeal(playerState.maxHp).then(() => {
        setHealEffectText(`+${playerState.maxHp}`);
        window.setTimeout(() => setHealEffectText(null), 300);
        setSupportNpc(null);
        setSupportExiting(false);
        const continuation = supportContinuationRef.current;
        supportContinuationRef.current = null;
        continuation?.();
      });
    }, 350);
  };

  const potionQuantity = (kind: PotionKind) =>
    getItemQuantity(
      inventoryState,
      kind === "smallPotion" ? "potion-small" : "potion-medium",
    );

  const potionName = (kind: PotionKind) =>
    kind === "smallPotion" ? "소형 포션" : "중형 포션";

  const useSelectedPotion = async () => {
    if (!selectedPotion || resolvingRef.current) return;
    const result = resolvePotionUse({
      currentHp: playerState.currentHp,
      maxHp: playerState.maxHp,
      potionKind: selectedPotion,
      quantity: potionQuantity(selectedPotion),
    });
    if (!result.success) {
      setSelectedPotion(null);
      setPhase("command");
      return;
    }
    resolvingRef.current = true;
    const itemId = selectedPotion === "smallPotion" ? "potion-small" : "potion-medium";
    setInventoryState((current) => changeItemQuantity(current, itemId, -1));
    onInventoryChanged();
    await onHeal(result.healedAmount);
    setHealEffectText(`+${result.healedAmount}`);
    window.setTimeout(() => setHealEffectText(null), 300);
    resolvingRef.current = false;
    setSelectedPotion(null);
    setPhase("command");
  };

  const statusBar = (
    <PlayerStatusBar
      {...playerState}
      questionLabel={`${Math.min(questionIndex + 1, BOSS_QUIZ_QUESTION_COUNT)} / ${BOSS_QUIZ_QUESTION_COUNT}`}
    />
  );

  if (phase === "gameOver") return null;

  if (phase === "supportPrelude" && supportNpc) {
    return (
      <section className="boss-combat-layer boss-support-layer" aria-label="전투 불능">
        <CombatDialoguePanel mode="message" statusBar={statusBar}>
          <div className="combat-message-layout">
            <p className="combat-message" role="status">눈 앞이 어두워진다..</p>
            <button type="button" className="combat-message-next" onClick={startNpcSupportCutin}>
              다음
            </button>
          </div>
        </CombatDialoguePanel>
      </section>
    );
  }

  if (phase === "support" && supportNpc) {
    return (
      <section className="boss-combat-layer boss-support-layer" aria-label={`${supportNpc.name} 지원`}>
        <div className="boss-support-visual" aria-hidden="true">
          <img
            key={`${supportNpc.name}-${supportCountRef.current}`}
            src={supportNpc.imageUrl}
            alt=""
            className={supportExiting ? "is-exiting" : "is-entering"}
          />
        </div>
        {supportReady && (
          <CombatDialoguePanel mode="message" statusBar={statusBar}>
            <div className="combat-message-layout">
              <p className="combat-message" role="status">
                {supportNpc.subject} 지원한다.<br />당신은 다시 일어났다.
              </p>
              <button type="button" className="combat-message-next" onClick={finishNpcSupport}>
                다음
              </button>
            </div>
          </CombatDialoguePanel>
        )}
      </section>
    );
  }

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
      {healEffectText && (
        <strong className="combat-floating-text is-heal">{healEffectText}</strong>
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

        {phase === "command" && (
          <div className="combat-message-layout">
            <p className="combat-message" role="status">무엇을 할까?</p>
            <div className="combat-command-buttons">
              <button type="button" onClick={() => setPhase("question")}>공격하기</button>
              <button
                type="button"
                disabled={
                  playerState.currentHp >= playerState.maxHp ||
                  (potionQuantity("smallPotion") <= 0 && potionQuantity("mediumPotion") <= 0)
                }
                onClick={() => setPhase("itemSelect")}
              >
                아이템 사용
              </button>
            </div>
          </div>
        )}

        {phase === "itemSelect" && (
          <div className="combat-item-panel" aria-label="아이템 선택">
            {(["smallPotion", "mediumPotion"] as const).map((kind) => {
              const itemId = kind === "smallPotion" ? "potion-small" : "potion-medium";
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={potionQuantity(kind) <= 0 || playerState.currentHp >= playerState.maxHp}
                  onClick={() => { setSelectedPotion(kind); setPhase("itemConfirm"); }}
                >
                  <ItemIcon item={getItemDefinition(itemId)!} />
                  <strong>{potionName(kind)}</strong>
                  <span>HP +{getPotionHealAmount(kind)}</span>
                  <small>보유 {potionQuantity(kind)}개</small>
                </button>
              );
            })}
            <button type="button" onClick={() => setPhase("command")}>뒤로</button>
          </div>
        )}

        {phase === "itemConfirm" && selectedPotion && (
          <div className="combat-item-confirm">
            <p>
              {potionName(selectedPotion)} · HP +{getPotionHealAmount(selectedPotion)} · 보유 {potionQuantity(selectedPotion)}개
            </p>
            <div>
              <button type="button" onClick={() => void useSelectedPotion()}>사용</button>
              <button type="button" onClick={() => { setSelectedPotion(null); setPhase("itemSelect"); }}>취소</button>
            </div>
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
                onClick={revealDodgeResult}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className="combat-message-next"
                disabled={applyingDodgeResult}
                onClick={() => void applyDodgeResult()}
              >
                다음
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
