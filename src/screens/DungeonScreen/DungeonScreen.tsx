import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ScreenId } from "../../app/routes";
import { TEST_QUESTIONS } from "../../data/testQuestions";
import { runNormalCombatChecks } from "../../game/combat/normalCombatChecks";
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
  | "playerCommand"
  | "question"
  | "playerAttack"
  | "enemyReaction"
  | "enemyTurn"
  | "finishingAttack"
  | "victory"
  | "enemyEscaped"
  | "result";

type CombatVisuals = {
  sword: SwordViewModel;
  weapon: WeaponAnimationController;
  monster: MonsterAnimationController;
};

const NORMAL_COMBAT_QUESTIONS = [TEST_QUESTIONS[0], TEST_QUESTIONS[1]] as const;
const MAX_HP = 50;
const ENEMY_ATTACK = 7;

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));

export function DungeonScreen({ onNavigate }: DungeonScreenProps) {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const visualsRef = useRef<CombatVisuals | null>(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const pendingResultRef = useRef<QuestionResult | null>(null);
  const weaponResultRef = useRef<WeaponAttackType | null>(null);
  const answersRef = useRef<boolean[]>([]);
  const questionIndexRef = useRef(0);

  const [phase, setPhase] = useState<NormalCombatPhase>("playerCommand");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [enemyAttackCount, setEnemyAttackCount] = useState(0);
  const [combatMessage, setCombatMessage] = useState(
    "마늘킹이 길을 막고 있습니다.",
  );
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [resolution, setResolution] =
    useState<NormalCombatResolution | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    if (import.meta.env.DEV) {
      runNormalCombatChecks();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
    monsterBillboard.position.set(0, -0.35, -4.7);
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
    visualsRef.current = { sword, weapon, monster: monsterAnimation };

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
    if (!mountedRef.current) {
      return;
    }
    setPhase("enemyTurn");
    setCombatMessage("마늘킹의 공격!");
    await visualsRef.current?.monster.play("attack", () => {
      if (!mountedRef.current) {
        return;
      }
      setPlayerHp((current) => Math.max(0, current - ENEMY_ATTACK));
      setEnemyAttackCount((current) => current + 1);
      setFloatingText(`-${ENEMY_ATTACK}`);
      setDamageFlash(true);
      window.setTimeout(() => {
        if (mountedRef.current) {
          setFloatingText(null);
          setDamageFlash(false);
        }
      }, 240);
    });
  };

  const finishCombat = async (finalAnswers: readonly [boolean, boolean]) => {
    const finalResolution = resolveNormalCombat(finalAnswers);

    if (finalResolution.enemyDefeated) {
      setPhase("victory");
      setCombatMessage("마늘킹을 쓰러뜨렸습니다!");
      await visualsRef.current?.monster.play("defeat");
    } else {
      await playEnemyTurn();
      setPhase("enemyEscaped");
      setCombatMessage("마늘킹이 경계하다가 도망쳤습니다.");
      await visualsRef.current?.monster.play("escape");
    }

    if (!mountedRef.current) {
      return;
    }
    setResolution(finalResolution);
    setPhase("result");
    processingRef.current = false;
  };

  const processAnswer = async (isCorrect: boolean) => {
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;
    if (visualsRef.current) {
      visualsRef.current.sword.root.visible = true;
    }
    setPhase("playerAttack");
    setCombatMessage(isCorrect ? "정답! 공격합니다." : "공격했지만 빗나갔습니다.");
    setFloatingText(null);

    await playSword(isCorrect ? "hit" : "miss");
    if (!mountedRef.current) {
      return;
    }

    setPhase("enemyReaction");
    if (isCorrect) {
      setFloatingText("HIT");
      await visualsRef.current?.monster.play("hit");
    } else {
      setFloatingText("MISS");
      await visualsRef.current?.monster.play("miss");
    }
    if (!mountedRef.current) {
      return;
    }
    setFloatingText(null);

    const currentQuestion = questionIndexRef.current;
    const nextAnswers = [...answersRef.current, isCorrect];
    answersRef.current = nextAnswers;

    if (currentQuestion === 0) {
      await playEnemyTurn();
      if (!mountedRef.current) {
        return;
      }
      questionIndexRef.current = 1;
      setQuestionIndex(1);
      setPhase("playerCommand");
      setCombatMessage("두 번째 공격 기회입니다.");
      processingRef.current = false;
      return;
    }

    const finalAnswers = nextAnswers as [boolean, boolean];
    const correctCount = finalAnswers.filter(Boolean).length;
    if (correctCount > 0) {
      if (!isCorrect) {
        setPhase("enemyReaction");
        setCombatMessage("마늘킹이 비틀거립니다.");
        await visualsRef.current?.monster.play("stagger");
        setPhase("finishingAttack");
        setCombatMessage("마무리 공격!");
        await playSword("finish");
      }
      await finishCombat(finalAnswers);
      return;
    }

    await finishCombat(finalAnswers);
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
    if (phase !== "question" || processingRef.current) {
      return;
    }
    const result = pendingResultRef.current;
    if (!result) {
      return;
    }
    void processAnswer(result.isCorrect);
  };

  const resetCombat = () => {
    if (phase !== "result") {
      return;
    }
    answersRef.current = [];
    questionIndexRef.current = 0;
    pendingResultRef.current = null;
    processingRef.current = false;
    visualsRef.current?.monster.reset();
    if (visualsRef.current) {
      visualsRef.current.sword.root.visible = true;
    }
    setQuestionIndex(0);
    setPlayerHp(MAX_HP);
    setEnemyAttackCount(0);
    setResolution(null);
    setFloatingText(null);
    setDamageFlash(false);
    setCombatMessage("마늘킹이 길을 막고 있습니다.");
    setPhase("playerCommand");
  };

  const forceResult = (answers: readonly [boolean, boolean]) => {
    if (!import.meta.env.DEV || phase !== "playerCommand") {
      return;
    }
    answersRef.current = [];
    questionIndexRef.current = 0;
    setQuestionIndex(0);
    void (async () => {
      await processAnswer(answers[0]);
      while (processingRef.current) {
        await wait(20);
      }
      await processAnswer(answers[1]);
    })();
  };

  const resultTitle =
    resolution?.outcome === "perfectVictory"
      ? "완벽한 승리"
      : resolution?.outcome === "hardVictory"
        ? "힘겨운 승리"
        : "전투 실패";

  return (
    <main className="game-screen dungeon-screen">
      <div
        ref={sceneContainerRef}
        className="dungeon-scene"
        aria-label="마늘킹과 마주친 던전 방"
      />
      <div className={`combat-damage-flash ${damageFlash ? "is-active" : ""}`} />
      {floatingText && (
        <strong className={`combat-floating-text is-${floatingText.toLowerCase()}`}>
          {floatingText}
        </strong>
      )}

      <section className="dungeon-overlay">
        <header className="combat-hud">
          <div>
            <p className="eyebrow">NORMAL COMBAT</p>
            <h1>마늘킹</h1>
          </div>
          <div className="combat-hud-values">
            <span>HP {playerHp} / {MAX_HP}</span>
            <span>문제 {Math.min(questionIndex + 1, 2)} / 2</span>
          </div>
        </header>

        <div className="dungeon-controls">
          <p className="combat-message" role="status">{combatMessage}</p>
          {phase === "playerCommand" && (
            <button type="button" onClick={openQuestion}>공격하기</button>
          )}
          {import.meta.env.DEV && phase === "playerCommand" && (
            <div className="developer-combat-controls">
              <span>개발용 결과 강제 실행</span>
              <div className="button-group">
                <button type="button" onClick={() => forceResult([true, true])}>정답 → 정답</button>
                <button type="button" onClick={() => forceResult([true, false])}>정답 → 오답</button>
                <button type="button" onClick={() => forceResult([false, true])}>오답 → 정답</button>
                <button type="button" onClick={() => forceResult([false, false])}>오답 → 오답</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {phase === "question" && (
        <QuestionScreen
          key={questionIndex}
          embedded
          eyebrow="NORMAL COMBAT"
          questions={[NORMAL_COMBAT_QUESTIONS[questionIndex]]}
          onNavigate={onNavigate}
          onResult={(result) => {
            if (!pendingResultRef.current) {
              pendingResultRef.current = result;
            }
          }}
          onComplete={completeQuestionReview}
        />
      )}

      {phase === "result" && resolution && (
        <section className="combat-result-overlay" aria-labelledby="combat-result-title">
          <div className="combat-result-card">
            <p className="eyebrow">COMBAT RESULT</p>
            <h2 id="combat-result-title">{resultTitle}</h2>
            <dl>
              <div><dt>정답 수</dt><dd>{resolution.correctAnswerCount} / 2</dd></div>
              <div><dt>받은 몬스터 공격 횟수</dt><dd>{enemyAttackCount}</dd></div>
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
        </section>
      )}
    </main>
  );
}
