import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ScreenId } from "../../app/routes";
import {
  CombatDialoguePanel,
  type CombatDialogueMode,
} from "../../components/combat/CombatDialoguePanel";
import { TEST_QUESTIONS } from "../../data/testQuestions";
import { runNormalCombatChecks } from "../../game/combat/normalCombatChecks";
import { runCriticalChecks } from "../../game/combat/criticalChecks";
import {
  DEFAULT_CRITICAL_CHANCE,
  applyCriticalResult,
  consumeEnemyTurnSkip,
  resolveCritical,
  type CriticalCombatState,
} from "../../game/combat/criticalResolver";
import {
  resolveNormalCombat,
  type NormalCombatResolution,
} from "../../game/combat/normalCombatResolver";
import type { QuestionResult } from "../../types/question";
import { QuestionScreen } from "../QuestionScreen/QuestionScreen";
import { MonsterAnimationController } from "../../three/monster/MonsterAnimationController";
import {
  BASIC_SWORD_DEFINITION,
  SwordViewModel,
} from "../../three/weapon/SwordViewModel";
import {
  WeaponAnimationController,
  type WeaponAttackType,
} from "../../three/weapon/WeaponAnimationController";

type DungeonScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

type NormalCombatPhase =
  | "intro"
  | "playerCommand"
  | "question"
  | "review"
  | "awaitPlayerAttack"
  | "playerAttack"
  | "awaitAttackResult"
  | "awaitCriticalResult"
  | "awaitStunSkip"
  | "awaitEnemyTurn"
  | "enemyTurn"
  | "awaitDamageResult"
  | "awaitStagger"
  | "finishingAttack"
  | "victory"
  | "awaitEscape"
  | "enemyEscaped"
  | "result";

type CombatVisuals = {
  sword: SwordViewModel;
  weapon: WeaponAnimationController;
  monster: MonsterAnimationController;
  monsterRoot: THREE.Group;
};

const NORMAL_COMBAT_QUESTIONS = [TEST_QUESTIONS[0], TEST_QUESTIONS[1]] as const;
const MAX_HP = 50;
const ENEMY_ATTACK = 7;
const DEFAULT_PLAYER_NAME = "플레이어";
const MONSTER_COMMAND_POSITION = new THREE.Vector3(0, 0.12, -4.7);
const MONSTER_QUESTION_POSITION = new THREE.Vector3(0, 0.62, -4.7);
const MONSTER_POSITION_RESPONSE = 13;
const INITIAL_CRITICAL_STATE: CriticalCombatState = {
  hasCriticalOccurred: false,
  enemyStunned: false,
  pendingSkipEnemyTurn: false,
};

function dialogueModeForPhase(phase: NormalCombatPhase): CombatDialogueMode {
  switch (phase) {
    case "playerCommand":
      return "command";
    case "question":
      return "question";
    case "review":
      return "review";
    case "result":
      return "result";
    default:
      return "message";
  }
}

export function DungeonScreen({ onNavigate }: DungeonScreenProps) {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const visualsRef = useRef<CombatVisuals | null>(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const interactionLockRef = useRef(false);
  const enemyTurnProcessingRef = useRef(false);
  const resultFinalizedRef = useRef(false);
  const pendingResultRef = useRef<QuestionResult | null>(null);
  const weaponResultRef = useRef<WeaponAttackType | null>(null);
  const answersRef = useRef<boolean[]>([]);
  const questionIndexRef = useRef(0);
  const monsterPositionTargetRef = useRef(MONSTER_COMMAND_POSITION);
  const criticalStateRef = useRef<CriticalCombatState>(INITIAL_CRITICAL_STATE);
  const forceCriticalNextAttackRef = useRef(false);

  const [phase, setPhase] = useState<NormalCombatPhase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [actualEnemyAttackCount, setActualEnemyAttackCount] = useState(0);
  const [skippedEnemyAttackCount, setSkippedEnemyAttackCount] = useState(0);
  const [hasCriticalOccurred, setHasCriticalOccurred] = useState(false);
  const [enemyStunned, setEnemyStunned] = useState(false);
  const [criticalEffect, setCriticalEffect] = useState(false);
  const [forceCriticalNextAttack, setForceCriticalNextAttack] = useState(false);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [combatMessage, setCombatMessage] = useState(
    "마늘킹이 나타났다!",
  );
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [resolution, setResolution] =
    useState<NormalCombatResolution | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    if (import.meta.env.DEV) {
      runNormalCombatChecks();
      runCriticalChecks();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "intro") {
      return;
    }
    const timer = window.setTimeout(() => {
      if (mountedRef.current && !processingRef.current) {
        setPhase("playerCommand");
        setCombatMessage("무엇을 할까?");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    monsterPositionTargetRef.current =
      phase === "question" || phase === "review"
        ? MONSTER_QUESTION_POSITION
        : MONSTER_COMMAND_POSITION;
  }, [phase]);

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b10);

    const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);
    camera.lookAt(0, -0.15, -4);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const room = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const addRoomPlane = (
      width: number,
      height: number,
      color: number,
      position: [number, number, number],
      rotation: [number, number, number],
    ) => {
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(...position);
      plane.rotation.set(...rotation);
      room.add(plane);
      geometries.push(geometry);
      materials.push(material);
    };

    addRoomPlane(10, 12, 0x2b2927, [0, -3, -2], [-Math.PI / 2, 0, 0]);
    addRoomPlane(10, 12, 0x17191e, [0, 3, -2], [Math.PI / 2, 0, 0]);
    addRoomPlane(10, 6, 0x34363d, [0, 0, -8], [0, 0, 0]);
    addRoomPlane(10, 6, 0x292b31, [0, 0, 4], [0, Math.PI, 0]);
    addRoomPlane(12, 6, 0x24262c, [-5, 0, -2], [0, Math.PI / 2, 0]);
    addRoomPlane(12, 6, 0x24262c, [5, 0, -2], [0, -Math.PI / 2, 0]);
    scene.add(room);

    const monsterGeometry = new THREE.PlaneGeometry(2.9, 2.8);
    const monsterMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
    const monsterBillboard = new THREE.Group();
    monsterBillboard.name = "MonsterBillboard";
    monsterBillboard.position.copy(MONSTER_COMMAND_POSITION);
    monster.renderOrder = 100;
    monsterBillboard.add(monster);
    monsterBillboard.lookAt(camera.position);
    scene.add(monsterBillboard);

    const monsterAnimation = new MonsterAnimationController(monster);
    const monsterTexture = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}assets/monsters/test-monster.png`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        monsterMaterial.map = texture;
        monsterMaterial.needsUpdate = true;
      },
    );

    const sword = new SwordViewModel(camera);
    const weapon = new WeaponAnimationController(sword, camera);
    visualsRef.current = {
      sword,
      weapon,
      monster: monsterAnimation,
      monsterRoot: monsterBillboard,
    };

    const updateViewport = () => {
      weapon.cancel();
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      sword.updateAspect(aspect);
    };

    updateViewport();
    sword.setDefinition(BASIC_SWORD_DEFINITION, camera.aspect);
    window.addEventListener("resize", updateViewport);

    let animationFrameId = 0;
    const clock = new THREE.Clock();
    const render = () => {
      const delta = clock.getDelta();
      weapon.update(delta);
      monsterAnimation.update(delta);
      const positionBlend = 1 - Math.exp(-MONSTER_POSITION_RESPONSE * delta);
      monsterBillboard.position.lerp(
        monsterPositionTargetRef.current,
        positionBlend,
      );
      monsterBillboard.lookAt(camera.position);
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(render);
    };
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateViewport);
      visualsRef.current = null;
      monsterAnimation.dispose();
      weapon.dispose();
      sword.dispose();
      monsterTexture.dispose();
      monsterBillboard.removeFromParent();
      monster.removeFromParent();
      monsterGeometry.dispose();
      monsterMaterial.dispose();
      scene.remove(room);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const playSword = (attackType: WeaponAttackType): Promise<void> => {
    const weapon = visualsRef.current?.weapon;
    if (!weapon) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const recordResult = () => {
        weaponResultRef.current = attackType;
      };
      const started = weapon.play(attackType, {
        onHit: attackType === "hit" ? recordResult : undefined,
        onMiss: attackType === "miss" ? recordResult : undefined,
        onFinish: attackType === "finish" ? recordResult : undefined,
        onComplete: resolve,
      });
      if (!started) {
        resolve();
      }
    });
  };

  const playEnemyTurn = async () => {
    if (!mountedRef.current || enemyTurnProcessingRef.current) {
      return;
    }
    enemyTurnProcessingRef.current = true;
    try {
      setPhase("enemyTurn");
      setCombatMessage("마늘킹의 공격!");
      await visualsRef.current?.monster.play("attack", () => {
        if (!mountedRef.current) {
          return;
        }
        setPlayerHp((current) => Math.max(0, current - ENEMY_ATTACK));
        setActualEnemyAttackCount((current) => current + 1);
        setFloatingText(`-${ENEMY_ATTACK}`);
        setDamageFlash(true);
        window.setTimeout(() => {
          if (mountedRef.current) {
            setFloatingText(null);
            setDamageFlash(false);
          }
        }, 240);
      });
      if (!mountedRef.current) {
        return;
      }
      setPhase("awaitDamageResult");
      setCombatMessage(`${ENEMY_ATTACK}의 피해를 입었다.`);
    } finally {
      enemyTurnProcessingRef.current = false;
    }
  };

  const showResult = (finalResolution: NormalCombatResolution) => {
    if (!mountedRef.current || resultFinalizedRef.current) {
      return;
    }
    resultFinalizedRef.current = true;
    criticalStateRef.current = {
      ...criticalStateRef.current,
      enemyStunned: false,
      pendingSkipEnemyTurn: false,
    };
    setEnemyStunned(false);
    setCriticalEffect(false);
    setResolution(finalResolution);
    setPhase("result");
    processingRef.current = false;
    interactionLockRef.current = false;
  };

  const playVictory = async (finalAnswers: readonly [boolean, boolean]) => {
    const finalResolution = resolveNormalCombat(finalAnswers);
    setPhase("victory");
    setCombatMessage("마늘킹을 쓰러뜨렸다!");
    await visualsRef.current?.monster.play("defeat");
    if (!mountedRef.current) {
      return;
    }
    showResult(finalResolution);
  };

  const beginAnswerSequence = () => {
    if (processingRef.current || phase !== "review") {
      return;
    }
    processingRef.current = true;
    if (visualsRef.current) {
      visualsRef.current.sword.root.visible = true;
    }
    setPhase("awaitPlayerAttack");
    setCombatMessage(`${DEFAULT_PLAYER_NAME}의 공격!`);
    setFloatingText(null);
  };

  const playPlayerAttack = async (isCorrect: boolean) => {
    setPhase("playerAttack");
    setCombatMessage(`${DEFAULT_PLAYER_NAME}가 검을 휘두른다!`);
    const randomValue =
      isCorrect && forceCriticalNextAttackRef.current ? 0 : Math.random();
    const criticalResult = resolveCritical(
      {
        isCorrect,
        hasCriticalOccurred: criticalStateRef.current.hasCriticalOccurred,
        chance: DEFAULT_CRITICAL_CHANCE,
      },
      randomValue,
    );
    if (isCorrect && forceCriticalNextAttackRef.current) {
      forceCriticalNextAttackRef.current = false;
      setForceCriticalNextAttack(false);
    }
    criticalStateRef.current = applyCriticalResult(
      criticalStateRef.current,
      criticalResult,
      questionIndexRef.current === 0,
    );
    setHasCriticalOccurred(criticalStateRef.current.hasCriticalOccurred);
    setEnemyStunned(criticalStateRef.current.enemyStunned);
    setCriticalEffect(criticalResult.isCritical);
    await playSword(isCorrect ? "hit" : "miss");
    if (!mountedRef.current) {
      return;
    }

    if (isCorrect) {
      setFloatingText(criticalResult.isCritical ? "CRITICAL" : "HIT");
      await visualsRef.current?.monster.play(
        criticalResult.isCritical ? "criticalHit" : "hit",
      );
    } else {
      setFloatingText("MISS");
      await visualsRef.current?.monster.play("miss");
    }
    if (!mountedRef.current) {
      return;
    }
    if (!criticalResult.isCritical) {
      setFloatingText(null);
    }

    const nextAnswers = [...answersRef.current, isCorrect];
    answersRef.current = nextAnswers;
    setPhase(
      criticalResult.isCritical ? "awaitCriticalResult" : "awaitAttackResult",
    );
    setCombatMessage(
      criticalResult.isCritical
        ? "치명타!"
        : isCorrect
          ? "공격이 적중했다!"
          : "공격이 빗나갔다!",
    );
  };

  const continueAfterAttackResult = async () => {
    setFloatingText(null);
    setCriticalEffect(false);
    if (questionIndexRef.current === 0) {
      if (criticalStateRef.current.pendingSkipEnemyTurn) {
        setPhase("awaitStunSkip");
        setCombatMessage("마늘킹은 기절해서 움직일 수 없다!");
      } else {
        setPhase("awaitEnemyTurn");
        setCombatMessage("마늘킹의 턴!");
      }
      return;
    }

    criticalStateRef.current = {
      ...criticalStateRef.current,
      enemyStunned: false,
      pendingSkipEnemyTurn: false,
    };
    setEnemyStunned(false);
    const finalAnswers = answersRef.current as [boolean, boolean];
    const correctCount = finalAnswers.filter(Boolean).length;
    if (correctCount === 2) {
      await playVictory(finalAnswers);
    } else if (correctCount === 1) {
      setPhase("awaitStagger");
      setCombatMessage("마늘킹이 크게 비틀거린다.");
    } else {
      setPhase("awaitEnemyTurn");
      setCombatMessage("마늘킹의 턴!");
    }
  };

  const advanceCombatMessage = async () => {
    if (interactionLockRef.current) {
      return;
    }
    interactionLockRef.current = true;
    setInteractionLocked(true);
    try {
      if (phase === "awaitPlayerAttack") {
        const result = pendingResultRef.current;
        if (result) {
          await playPlayerAttack(result.isCorrect);
        }
        return;
      }

      if (
        phase === "awaitAttackResult" ||
        phase === "awaitCriticalResult"
      ) {
        await continueAfterAttackResult();
        return;
      }

      if (phase === "awaitStunSkip") {
        const consumed = consumeEnemyTurnSkip(criticalStateRef.current);
        criticalStateRef.current = consumed.state;
        if (consumed.skipped) {
          setSkippedEnemyAttackCount((current) => current + 1);
        }
        setEnemyStunned(false);
        questionIndexRef.current = 1;
        setQuestionIndex(1);
        pendingResultRef.current = null;
        setPhase("playerCommand");
        setCombatMessage("무엇을 할까?");
        processingRef.current = false;
        return;
      }

      if (phase === "awaitEnemyTurn") {
        await playEnemyTurn();
        return;
      }

      if (phase === "awaitDamageResult") {
        if (questionIndexRef.current === 0) {
          questionIndexRef.current = 1;
          setQuestionIndex(1);
          pendingResultRef.current = null;
          setPhase("playerCommand");
          setCombatMessage("무엇을 할까?");
          processingRef.current = false;
        } else {
          setPhase("awaitEscape");
          setCombatMessage("마늘킹이 경계하며 뒤로 물러난다.");
        }
        return;
      }

      if (phase === "awaitStagger") {
        setPhase("finishingAttack");
        setCombatMessage("마무리 공격!");
        await visualsRef.current?.monster.play("stagger");
        await playSword("finish");
        await playVictory(answersRef.current as [boolean, boolean]);
        return;
      }

      if (phase === "awaitEscape") {
        const finalResolution = resolveNormalCombat(
          answersRef.current as [boolean, boolean],
        );
        setPhase("enemyEscaped");
        setCombatMessage("마늘킹이 달아난다.");
        await visualsRef.current?.monster.play("escape");
        showResult(finalResolution);
      }
    } finally {
      interactionLockRef.current = false;
      setInteractionLocked(false);
    }
  };

  const openQuestion = () => {
    if (phase !== "playerCommand" || processingRef.current) {
      return;
    }
    pendingResultRef.current = null;
    if (visualsRef.current) {
      visualsRef.current.sword.root.visible = false;
    }
    setPhase("question");
    setCombatMessage("문제를 풀고 해설을 확인하세요.");
  };

  const completeQuestionReview = () => {
    if (phase !== "review" || processingRef.current) {
      return;
    }
    const result = pendingResultRef.current;
    if (!result) {
      return;
    }
    beginAnswerSequence();
  };

  const resetCombat = () => {
    if (phase !== "result") {
      return;
    }
    answersRef.current = [];
    questionIndexRef.current = 0;
    pendingResultRef.current = null;
    processingRef.current = false;
    interactionLockRef.current = false;
    enemyTurnProcessingRef.current = false;
    resultFinalizedRef.current = false;
    criticalStateRef.current = INITIAL_CRITICAL_STATE;
    forceCriticalNextAttackRef.current = false;
    visualsRef.current?.monster.reset();
    if (visualsRef.current) {
      visualsRef.current.sword.root.visible = true;
    }
    setQuestionIndex(0);
    setPlayerHp(MAX_HP);
    setActualEnemyAttackCount(0);
    setSkippedEnemyAttackCount(0);
    setHasCriticalOccurred(false);
    setEnemyStunned(false);
    setCriticalEffect(false);
    setForceCriticalNextAttack(false);
    setInteractionLocked(false);
    setResolution(null);
    setFloatingText(null);
    setDamageFlash(false);
    setCombatMessage("마늘킹이 나타났다!");
    setPhase("intro");
  };

  const resultTitle =
    resolution?.outcome === "perfectVictory"
      ? "완벽한 승리"
      : resolution?.outcome === "hardVictory"
        ? "힘겨운 승리"
        : "전투 실패";
  const dialogueMode = dialogueModeForPhase(phase);
  const animationInProgress = [
    "playerAttack",
    "enemyTurn",
    "finishingAttack",
    "victory",
    "enemyEscaped",
  ].includes(phase);
  const buttonsLocked = animationInProgress || interactionLocked;
  const hpPercent = Math.max(0, Math.min(100, (playerHp / MAX_HP) * 100));
  const combatStatusBar = (
    <div
      className="combat-status-bar"
      aria-label={`레벨 1, 플레이어 체력 ${playerHp} / ${MAX_HP}, 문제 ${Math.min(questionIndex + 1, 2)} / 2`}
    >
      <strong className="combat-status-level">LV.1</strong>
      <div className="combat-status-hp">
        <span>HP</span>
        <div
          className="player-hp-track"
          role="progressbar"
          aria-label="플레이어 HP"
          aria-valuemin={0}
          aria-valuemax={MAX_HP}
          aria-valuenow={playerHp}
        >
          <div className="player-hp-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <strong>{playerHp} / {MAX_HP}</strong>
      </div>
      <div className="combat-status-question">
        <span>QUESTION</span>
        <strong>{Math.min(questionIndex + 1, 2)} / 2</strong>
      </div>
    </div>
  );

  return (
    <main
      className={`game-screen dungeon-screen ${criticalEffect ? "is-critical-impact" : ""}`}
    >
      <div
        ref={sceneContainerRef}
        className="dungeon-scene"
        aria-label="마늘킹과 마주친 던전 방"
      />
      <div className={`combat-damage-flash ${damageFlash ? "is-active" : ""}`} />
      <div
        className={`combat-critical-accent ${criticalEffect ? "is-active" : ""}`}
        aria-hidden="true"
      />
      {enemyStunned && (
        <div
          className="monster-stun-indicator"
          role="status"
          aria-label="마늘킹 기절"
        >
          <span aria-hidden="true">★ ✦ ★</span>
          <strong>기절</strong>
        </div>
      )}
      {floatingText && (
        <strong className={`combat-floating-text is-${floatingText.toLowerCase()}`}>
          {floatingText}
        </strong>
      )}

      <section className="dungeon-overlay">
        <header className="combat-hud">
          <div className="monster-status-hud">
            <p className="eyebrow">NORMAL COMBAT</p>
            <h1>마늘킹</h1>
            <small>
              {enemyStunned
                ? "기절"
                : phase === "enemyEscaped"
                ? "도주 중"
                : phase === "victory" || phase === "result"
                  ? "전투 종료"
                  : "일반 몬스터"}
            </small>
          </div>
        </header>
      </section>

      <CombatDialoguePanel
        mode={dialogueMode}
        busy={buttonsLocked}
        statusBar={combatStatusBar}
      >
        {(dialogueMode === "message" || dialogueMode === "command") && (
          <div className="combat-message-layout">
            <p className="combat-message" role="status">{combatMessage}</p>
            {phase === "playerCommand" && (
              <>
                <div className="combat-command-buttons">
                  <button type="button" onClick={openQuestion}>공격하기</button>
                  <button
                    type="button"
                    disabled
                    title="아직 사용할 수 없습니다."
                  >
                    아이템
                    <small>아직 사용할 수 없습니다.</small>
                  </button>
                </div>
                {import.meta.env.DEV && (
                  <div className="developer-combat-controls">
                    <button
                      type="button"
                      aria-pressed={forceCriticalNextAttack}
                      onClick={() => {
                        const next = !forceCriticalNextAttackRef.current;
                        forceCriticalNextAttackRef.current = next;
                        setForceCriticalNextAttack(next);
                      }}
                    >
                      {forceCriticalNextAttack
                        ? "다음 정답 크리티컬 강제: ON"
                        : "다음 정답 크리티컬 강제"}
                    </button>
                    <small>개발 빌드에서만 표시됩니다.</small>
                  </div>
                )}
              </>
            )}
            {[
              "awaitPlayerAttack",
              "awaitAttackResult",
              "awaitCriticalResult",
              "awaitStunSkip",
              "awaitEnemyTurn",
              "awaitDamageResult",
              "awaitStagger",
              "awaitEscape",
            ].includes(phase) && (
              <button
                type="button"
                className="combat-message-next"
                disabled={buttonsLocked}
                onClick={() => void advanceCombatMessage()}
              >
                다음
              </button>
            )}
          </div>
        )}

        {(phase === "question" || phase === "review") && (
          <QuestionScreen
            key={questionIndex}
            embedded
            eyebrow={`QUESTION ${questionIndex + 1}`}
            questions={[NORMAL_COMBAT_QUESTIONS[questionIndex]]}
            onNavigate={onNavigate}
            onReviewChange={(result) => {
              if (!pendingResultRef.current) {
                pendingResultRef.current = result;
                setPhase("review");
              }
            }}
            onResult={(result) => {
              if (!pendingResultRef.current) {
                pendingResultRef.current = result;
              }
            }}
            onComplete={completeQuestionReview}
          />
        )}

        {phase === "result" && resolution && (
          <div className="combat-result-card" aria-labelledby="combat-result-title">
            <p className="eyebrow">COMBAT RESULT</p>
            <h2 id="combat-result-title">{resultTitle}</h2>
            <dl>
              <div><dt>정답 수</dt><dd>{resolution.correctAnswerCount} / 2</dd></div>
              <div><dt>받은 몬스터 공격 횟수</dt><dd>{actualEnemyAttackCount}</dd></div>
              <div><dt>크리티컬</dt><dd>{hasCriticalOccurred ? "1회" : "없음"}</dd></div>
              {skippedEnemyAttackCount > 0 && (
                <div><dt>기절로 공격 무효</dt><dd>{skippedEnemyAttackCount}회</dd></div>
              )}
            </dl>
            {resolution.outcome === "enemyEscaped" && (
              <p>몬스터가 도망쳤습니다.</p>
            )}
            <div className="button-group">
              <button type="button" onClick={resetCombat}>다시 테스트</button>
              <button type="button" onClick={() => onNavigate("baseCamp")}>베이스캠프로 돌아가기</button>
              <button type="button" onClick={() => onNavigate("title")}>타이틀로 돌아가기</button>
            </div>
          </div>
        )}
      </CombatDialoguePanel>
    </main>
  );
}
