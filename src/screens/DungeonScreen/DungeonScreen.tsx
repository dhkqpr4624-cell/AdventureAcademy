import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ScreenId } from "../../app/routes";
import {
  CombatDialoguePanel,
  type CombatDialogueMode,
} from "../../components/combat/CombatDialoguePanel";
import { runNormalCombatChecks } from "../../game/combat/normalCombatChecks";
import { runCriticalChecks } from "../../game/combat/criticalChecks";
import { runPotionChecks } from "../../game/combat/potionChecks";
import { runDungeonMapChecks } from "../../game/dungeon/dungeonMapChecks";
import { runDungeonCameraChecks } from "../../game/dungeon/dungeonCameraChecks";
import { runDungeonCompletionChecks } from "../../game/dungeon/dungeonCompletionChecks";
import { resolveDungeonCompletion } from "../../game/dungeon/dungeonCompletionResolver";
import {
  getDungeonQuestionSet,
  runDungeonQuestionChecks,
} from "../../game/dungeon/dungeonQuestionSets";
import {
  completeRoomEvent,
  completeRoomEventWithResult,
  createInitialRoomProgress,
  shouldCompleteCombatRoom,
} from "../../game/dungeon/dungeonRoomProgress";
import { resolveRoomEntry } from "../../game/dungeon/RoomEventController";
import {
  advanceTrapIntro,
  getTrapIntroStep,
  getTreasurePromptStep,
  type DungeonEventFlowPhase,
} from "../../game/dungeon/dungeonEventFlowResolver";
import { runDungeonEventFlowChecks } from "../../game/dungeon/dungeonEventFlowChecks";
import { runDungeonRoomEventChecks } from "../../game/dungeon/dungeonRoomEventChecks";
import { resolveDungeonRoomEvent } from "../../game/dungeon/dungeonRoomEventResolver";
import {
  DUNGEON_PLAYER_MAX_HP,
  INITIAL_MEDIUM_POTION_QUANTITY,
  INITIAL_SMALL_POTION_QUANTITY,
  applyDungeonPlayerDamage,
  applyDungeonPlayerHealing,
} from "../../game/dungeon/dungeonPlayerState";
import { runDungeonPlayerStateChecks } from "../../game/dungeon/dungeonPlayerStateChecks";
import {
  getConnectionsForRoom,
  getDungeonRoom,
  TEST_DUNGEON_MAP,
} from "../../game/dungeon/testDungeonMap";
import type {
  DungeonDirection,
  DungeonRoomNode,
  DungeonRoomProgress,
  TraversableDungeonConnection,
} from "../../game/dungeon/dungeonTypes";
import treasureClosedUrl from "../../assets/dungeon/events/treasure_closed.png";
import treasureOpenUrl from "../../assets/dungeon/events/treasure_open.png";
import trapIdleUrl from "../../assets/dungeon/events/trap_idle.png";
import trapTriggeredUrl from "../../assets/dungeon/events/trap_triggered.png";
import {
  getPotionHealAmount,
  resolvePotionUse,
  type PotionKind,
  type PotionUseResult,
} from "../../game/combat/potionResolver";
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
import { DungeonCameraController } from "../../three/dungeon/DungeonCameraController";
import {
  BASIC_SWORD_DEFINITION,
  SwordViewModel,
} from "../../three/weapon/SwordViewModel";
import {
  WeaponAnimationController,
  type WeaponAttackType,
} from "../../three/weapon/WeaponAnimationController";
import { PlayerStatusBar } from "../../components/PlayerStatusBar";
import type { PlayerState } from "../../game/player/playerState";
import type { Dispatch, SetStateAction } from "react";

type DungeonScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  playerState: PlayerState;
  setPlayerState: Dispatch<SetStateAction<PlayerState>>;
};

type NormalCombatPhase =
  | "intro"
  | "playerCommand"
  | "itemSelect"
  | "awaitItemUse"
  | "itemUse"
  | "awaitHealResult"
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
  camera: THREE.PerspectiveCamera;
  dungeonCamera: DungeonCameraController;
};

type DungeonMode = "exploration" | "moving" | "roomEvent" | "combat";
type RoomEventKind = "treasure" | "trap";
type ActiveRoomEvent = {
  roomId: string;
  kind: RoomEventKind;
  phase: DungeonEventFlowPhase;
  isCorrect?: boolean;
  message?: string;
};

const MAX_HP = DUNGEON_PLAYER_MAX_HP;
const ENEMY_ATTACK = 7;
const DEFAULT_PLAYER_NAME = "플레이어";
const MONSTER_QUESTION_Y_OFFSET = 0.34;
const MONSTER_PLANE_HEIGHT = 2.05;
const MONSTER_TEXTURE_ASPECT = 812 / 778;
const MONSTER_POSITION_RESPONSE = 13;
const INITIAL_CRITICAL_STATE: CriticalCombatState = {
  hasCriticalOccurred: false,
  enemyStunned: false,
  pendingSkipEnemyTurn: false,
};
const DIRECTION_ORDER: DungeonDirection[] = [
  "forward",
  "left",
  "right",
  "back",
];
const DIRECTION_LABELS: Record<DungeonDirection, string> = {
  forward: "앞으로 가기",
  left: "왼쪽 길로 가기",
  right: "오른쪽 길로 가기",
  back: "뒤로가기",
};

function requireTreasureConfig(room: DungeonRoomNode) {
  if (!room.eventConfig || !("rewardId" in room.eventConfig)) {
    throw new Error(`[DungeonScreen] Treasure room ${room.id} has no treasure config`);
  }
  return room.eventConfig;
}

function requireTrapConfig(room: DungeonRoomNode) {
  if (!room.eventConfig || !("damage" in room.eventConfig)) {
    throw new Error(`[DungeonScreen] Trap room ${room.id} has no trap config`);
  }
  return room.eventConfig;
}

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

export function DungeonScreen({
  onNavigate,
  playerState,
  setPlayerState,
}: DungeonScreenProps) {
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
  const monsterPositionTargetRef = useRef(new THREE.Vector3(0, 0.05, -5));
  const criticalStateRef = useRef<CriticalCombatState>(INITIAL_CRITICAL_STATE);
  const forceCriticalNextAttackRef = useRef(false);
  const itemProcessingRef = useRef(false);
  const selectedPotionRef = useRef<PotionKind | null>(null);
  const pendingPotionResultRef = useRef<PotionUseResult | null>(null);
  const enemyTurnFromItemRef = useRef(false);
  const movementProcessingRef = useRef(false);
  const roomEventProcessingRef = useRef(false);
  const dungeonCompletionProcessingRef = useRef(false);
  const activeCombatRoomIdRef = useRef<string | null>(null);
  const pendingRoomEventResultRef = useRef<QuestionResult | null>(null);
  const activeRoomEventRef = useRef<ActiveRoomEvent | null>(null);
  const eventInteractionLockRef = useRef(false);
  const eventResultProcessingRef = useRef(false);
  const activeQuestionsRef = useRef(
    getDungeonQuestionSet("normal-garlic-a"),
  );
  const roomProgressRef = useRef<Record<string, DungeonRoomProgress>>(
    createInitialRoomProgress(TEST_DUNGEON_MAP),
  );

  const [phase, setPhase] = useState<NormalCombatPhase>("intro");
  const [dungeonMode, setDungeonMode] = useState<DungeonMode>("exploration");
  const [currentRoomId, setCurrentRoomId] = useState(
    TEST_DUNGEON_MAP.startRoomId,
  );
  const [previousRoomId, setPreviousRoomId] = useState<string | null>(null);
  const [activeCombatRoomId, setActiveCombatRoomId] = useState<string | null>(
    null,
  );
  const [roomProgress, setRoomProgress] = useState(
    roomProgressRef.current,
  );
  const [explorationMessage, setExplorationMessage] = useState(
    "던전의 시작점이다.",
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const playerHp = playerState.currentHp;
  const setPlayerHp = (
    next: number | ((current: number) => number),
  ) => {
    setPlayerState((current) => ({
      ...current,
      currentHp:
        typeof next === "function" ? next(current.currentHp) : next,
    }));
  };
  const [actualEnemyAttackCount, setActualEnemyAttackCount] = useState(0);
  const [skippedEnemyAttackCount, setSkippedEnemyAttackCount] = useState(0);
  const [hasCriticalOccurred, setHasCriticalOccurred] = useState(false);
  const [enemyStunned, setEnemyStunned] = useState(false);
  const [criticalEffect, setCriticalEffect] = useState(false);
  const [forceCriticalNextAttack, setForceCriticalNextAttack] = useState(false);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [smallPotionQuantity, setSmallPotionQuantity] = useState(
    INITIAL_SMALL_POTION_QUANTITY,
  );
  const [mediumPotionQuantity, setMediumPotionQuantity] = useState(
    INITIAL_MEDIUM_POTION_QUANTITY,
  );
  const [selectedPotion, setSelectedPotion] = useState<PotionKind | null>(null);
  const [mustAttackNextTurn, setMustAttackNextTurn] = useState(false);
  const [combatMessage, setCombatMessage] = useState(
    "마늘킹이 나타났다!",
  );
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [resolution, setResolution] =
    useState<NormalCombatResolution | null>(null);
  const [activeQuestions, setActiveQuestions] = useState(
    activeQuestionsRef.current,
  );
  const [activeRoomEvent, setActiveRoomEvent] =
    useState<ActiveRoomEvent | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    if (import.meta.env.DEV) {
      runNormalCombatChecks();
      runCriticalChecks();
      runPotionChecks();
      runDungeonMapChecks();
      runDungeonCameraChecks();
      runDungeonQuestionChecks(TEST_DUNGEON_MAP);
      runDungeonCompletionChecks();
      runDungeonRoomEventChecks();
      runDungeonEventFlowChecks();
      runDungeonPlayerStateChecks();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const visuals = visualsRef.current;
    if (!visuals) {
      return;
    }
    const showMonster =
      dungeonMode === "combat" &&
      activeCombatRoomId === currentRoomId &&
      !roomProgress[currentRoomId]?.eventCompleted;
    visuals.monsterRoot.visible = showMonster;
  }, [activeCombatRoomId, currentRoomId, dungeonMode, roomProgress]);

  useEffect(() => {
    if (dungeonMode !== "combat" || phase !== "intro") {
      return;
    }
    const timer = window.setTimeout(() => {
      if (mountedRef.current && !processingRef.current) {
        setPhase("playerCommand");
        setCombatMessage("무엇을 할까?");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dungeonMode, phase]);

  useEffect(() => {
    const room = getDungeonRoom(currentRoomId);
    const monsterPosition = room.combatConfig?.monsterPosition;
    if (!monsterPosition) {
      return;
    }
    monsterPositionTargetRef.current = new THREE.Vector3(...monsterPosition);
    if (phase === "question" || phase === "review") {
      monsterPositionTargetRef.current.y += MONSTER_QUESTION_Y_OFFSET;
    }
  }, [currentRoomId, phase]);

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b10);

    const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 100);
    const startRoom = getDungeonRoom(TEST_DUNGEON_MAP.startRoomId);
    camera.position.set(...startRoom.explorationCameraPose.position);
    camera.lookAt(...startRoom.explorationCameraPose.lookAt);
    scene.add(camera);
    const dungeonCamera = new DungeonCameraController(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const dungeonWorld = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const addRoomPlane = (
      parent: THREE.Group,
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
      parent.add(plane);
      geometries.push(geometry);
      materials.push(material);
    };

    TEST_DUNGEON_MAP.rooms.forEach((roomNode, index) => {
      const room = new THREE.Group();
      room.position.set(roomNode.position.x, roomNode.position.y, roomNode.position.z);
      const floorColor = index % 2 === 0 ? 0x2b2927 : 0x302d29;
      addRoomPlane(room, 10, 12, floorColor, [0, -3, -2], [-Math.PI / 2, 0, 0]);
      addRoomPlane(room, 10, 12, 0x17191e, [0, 3, -2], [Math.PI / 2, 0, 0]);
      addRoomPlane(room, 10, 6, 0x34363d, [0, 0, -8], [0, 0, 0]);
      addRoomPlane(room, 10, 6, 0x292b31, [0, 0, 4], [0, Math.PI, 0]);
      addRoomPlane(room, 12, 6, 0x24262c, [-5, 0, -2], [0, Math.PI / 2, 0]);
      addRoomPlane(room, 12, 6, 0x24262c, [5, 0, -2], [0, -Math.PI / 2, 0]);
      dungeonWorld.add(room);
    });
    TEST_DUNGEON_MAP.connections.forEach((connection) => {
      const source = getDungeonRoom(connection.fromRoomId);
      const target = getDungeonRoom(connection.toRoomId);
      const dx = target.position.x - source.position.x;
      const dz = target.position.z - source.position.z;
      const length = Math.hypot(dx, dz);
      const corridor = new THREE.Group();
      corridor.position.set(
        (source.position.x + target.position.x) / 2,
        0,
        (source.position.z + target.position.z) / 2,
      );
      corridor.rotation.y = Math.atan2(dx, dz);
      addRoomPlane(corridor, 4, length, 0x25231f, [0, -2.98, 0], [-Math.PI / 2, 0, 0]);
      addRoomPlane(corridor, 4, length, 0x15171b, [0, 2.98, 0], [Math.PI / 2, 0, 0]);
      dungeonWorld.add(corridor);
    });
    scene.add(dungeonWorld);

    const monsterGeometry = new THREE.PlaneGeometry(
      MONSTER_PLANE_HEIGHT * MONSTER_TEXTURE_ASPECT,
      MONSTER_PLANE_HEIGHT,
    );
    const monsterMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
    const monsterBillboard = new THREE.Group();
    monsterBillboard.name = "MonsterBillboard";
    monsterBillboard.position.copy(monsterPositionTargetRef.current);
    monsterBillboard.visible = false;
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
      camera,
      dungeonCamera,
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
      dungeonCamera.dispose();
      monsterAnimation.dispose();
      weapon.dispose();
      sword.dispose();
      monsterTexture.dispose();
      monsterBillboard.removeFromParent();
      monster.removeFromParent();
      monsterGeometry.dispose();
      monsterMaterial.dispose();
      scene.remove(dungeonWorld);
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
        setPlayerHp((current) =>
          applyDungeonPlayerDamage(current, ENEMY_ATTACK),
        );
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
    const combatRoomId = activeCombatRoomIdRef.current;
    if (
      combatRoomId &&
      getDungeonRoom(combatRoomId).type === "combat" &&
      shouldCompleteCombatRoom(finalResolution.outcome)
    ) {
      const nextProgress = completeRoomEvent(
        roomProgressRef.current,
        combatRoomId,
      );
      roomProgressRef.current = nextProgress;
      setRoomProgress(nextProgress);
    }
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

  const potionName = (kind: PotionKind) =>
    kind === "smallPotion" ? "소형 회복 물약" : "중형 회복 물약";

  const potionQuantity = (kind: PotionKind) =>
    kind === "smallPotion" ? smallPotionQuantity : mediumPotionQuantity;

  const openItemSelect = () => {
    if (
      phase !== "playerCommand" ||
      processingRef.current ||
      mustAttackNextTurn ||
      playerHp >= MAX_HP
    ) {
      return;
    }
    setPhase("itemSelect");
    setCombatMessage("사용할 아이템을 선택하세요.");
  };

  const selectPotion = (kind: PotionKind) => {
    if (
      phase !== "itemSelect" ||
      itemProcessingRef.current ||
      potionQuantity(kind) <= 0 ||
      playerHp >= MAX_HP
    ) {
      return;
    }
    selectedPotionRef.current = kind;
    setSelectedPotion(kind);
    setPhase("awaitItemUse");
    setCombatMessage(`${potionName(kind)}을 사용할까?`);
  };

  const cancelItemSelect = () => {
    if (itemProcessingRef.current) {
      return;
    }
    selectedPotionRef.current = null;
    setSelectedPotion(null);
    setPhase("playerCommand");
    setCombatMessage("무엇을 할까?");
  };

  const confirmPotionUse = () => {
    const kind = selectedPotionRef.current;
    if (
      phase !== "awaitItemUse" ||
      !kind ||
      itemProcessingRef.current ||
      processingRef.current
    ) {
      return;
    }

    itemProcessingRef.current = true;
    const result = resolvePotionUse({
      currentHp: playerHp,
      maxHp: MAX_HP,
      potionKind: kind,
      quantity: potionQuantity(kind),
    });
    if (!result.success) {
      itemProcessingRef.current = false;
      selectedPotionRef.current = null;
      setSelectedPotion(null);
      setPhase("itemSelect");
      setCombatMessage(
        result.failureReason === "fullHp"
          ? "HP가 가득 차 있어 물약을 사용할 수 없다."
          : "해당 물약을 가지고 있지 않다.",
      );
      return;
    }

    processingRef.current = true;
    enemyTurnFromItemRef.current = true;
    pendingPotionResultRef.current = result;
    if (kind === "smallPotion") {
      setSmallPotionQuantity(result.remainingQuantity);
    } else {
      setMediumPotionQuantity(result.remainingQuantity);
    }
    setMustAttackNextTurn(true);
    setPhase("itemUse");
    setCombatMessage(
      `${DEFAULT_PLAYER_NAME}는 ${potionName(kind)}을 사용했다.`,
    );
  };

  const applyPotionHealing = () => {
    const result = pendingPotionResultRef.current;
    if (phase !== "itemUse" || !result) {
      return;
    }
    setPlayerHp((current) =>
      applyDungeonPlayerHealing(current, result.healedAmount),
    );
    setFloatingText(`+${result.healedAmount}`);
    setPhase("awaitHealResult");
    setCombatMessage(`HP가 ${result.healedAmount} 회복되었다.`);
    window.setTimeout(() => {
      if (mountedRef.current) {
        setFloatingText(null);
      }
    }, 520);
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

      if (phase === "itemUse") {
        applyPotionHealing();
        return;
      }

      if (phase === "awaitHealResult") {
        pendingPotionResultRef.current = null;
        selectedPotionRef.current = null;
        setSelectedPotion(null);
        itemProcessingRef.current = false;
        setPhase("awaitEnemyTurn");
        setCombatMessage("마늘킹의 턴!");
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
        if (enemyTurnFromItemRef.current) {
          enemyTurnFromItemRef.current = false;
          pendingResultRef.current = null;
          setPhase("playerCommand");
          setCombatMessage("무엇을 할까?");
          processingRef.current = false;
        } else if (questionIndexRef.current === 0) {
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
        itemProcessingRef.current = false;
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
    setMustAttackNextTurn(false);
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

  const initializeCombatEncounterState = () => {
    answersRef.current = [];
    questionIndexRef.current = 0;
    pendingResultRef.current = null;
    processingRef.current = false;
    interactionLockRef.current = false;
    enemyTurnProcessingRef.current = false;
    resultFinalizedRef.current = false;
    criticalStateRef.current = INITIAL_CRITICAL_STATE;
    forceCriticalNextAttackRef.current = false;
    itemProcessingRef.current = false;
    selectedPotionRef.current = null;
    pendingPotionResultRef.current = null;
    enemyTurnFromItemRef.current = false;
    visualsRef.current?.monster.reset();
    if (visualsRef.current) {
      visualsRef.current.sword.root.visible = true;
    }
    setQuestionIndex(0);
    setActualEnemyAttackCount(0);
    setSkippedEnemyAttackCount(0);
    setHasCriticalOccurred(false);
    setEnemyStunned(false);
    setCriticalEffect(false);
    setForceCriticalNextAttack(false);
    setInteractionLocked(false);
    setSelectedPotion(null);
    setMustAttackNextTurn(false);
    setResolution(null);
    setFloatingText(null);
    setDamageFlash(false);
    setCombatMessage("마늘킹이 나타났다!");
    setPhase("intro");
  };

  const startCombatForRoom = (roomId: string) => {
    if (
      activeCombatRoomIdRef.current ||
      roomProgressRef.current[roomId]?.eventCompleted
    ) {
      return;
    }
    const room = getDungeonRoom(roomId);
    if (!room.combatConfig) {
      throw new Error(`[DungeonScreen] Combat room ${roomId} has no combatConfig`);
    }
    const questions = getDungeonQuestionSet(room.combatConfig.questionSetId);
    activeQuestionsRef.current = questions;
    setActiveQuestions(questions);
    activeCombatRoomIdRef.current = roomId;
    setActiveCombatRoomId(roomId);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    visualsRef.current?.dungeonCamera.transitionToPose(
      room.combatConfig.combatCameraPose,
      reducedMotion,
      () => {
        if (
          !mountedRef.current ||
          activeCombatRoomIdRef.current !== roomId ||
          roomProgressRef.current[roomId]?.eventCompleted
        ) {
          return;
        }
        initializeCombatEncounterState();
        setDungeonMode("combat");
      },
    );
  };

  const resetCombat = () => {
    if (phase !== "result" || !activeCombatRoomIdRef.current) {
      return;
    }
    const roomId = activeCombatRoomIdRef.current;
    const nextProgress = {
      ...roomProgressRef.current,
      [roomId]: { roomId, eventCompleted: false },
    };
    roomProgressRef.current = nextProgress;
    setRoomProgress(nextProgress);
    activeCombatRoomIdRef.current = null;
    setActiveCombatRoomId(null);
    startCombatForRoom(roomId);
  };

  const continueExplorationAfterResult = (
    message = "전투 이벤트가 끝났다. 이동할 길을 선택하자.",
  ) => {
    if (phase !== "result") {
      return;
    }
    const roomId = activeCombatRoomIdRef.current;
    if (!roomId) {
      return;
    }
    const room = getDungeonRoom(roomId);
    activeCombatRoomIdRef.current = null;
    setActiveCombatRoomId(null);
    setDungeonMode("roomEvent");
    visualsRef.current?.monster.reset();
    if (visualsRef.current) {
      visualsRef.current.monsterRoot.visible = false;
      visualsRef.current.sword.root.visible = true;
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    visualsRef.current?.dungeonCamera.transitionToPose(
      room.explorationCameraPose,
      reducedMotion,
      () => {
        if (!mountedRef.current) {
          return;
        }
        setExplorationMessage(message);
        setDungeonMode("exploration");
      },
    );
  };

  const tryCompleteDungeon = () => {
    if (dungeonCompletionProcessingRef.current) {
      return;
    }
    dungeonCompletionProcessingRef.current = true;
    const completion = resolveDungeonCompletion(
      TEST_DUNGEON_MAP,
      roomProgressRef.current,
    );
    if (completion.canComplete) {
      onNavigate("baseCamp");
      return;
    }
    const remainingCount = completion.remainingCombatRoomIds.length;
    continueExplorationAfterResult(
      `아직 완료하지 않은 전투방이 ${remainingCount}곳 남아 있다. ` +
        "던전의 몬스터를 모두 마주한 뒤 돌아오자.",
    );
    dungeonCompletionProcessingRef.current = false;
  };

  const updateActiveRoomEvent = (event: ActiveRoomEvent | null) => {
    activeRoomEventRef.current = event;
    setActiveRoomEvent(event);
  };

  const beginRoomEventQuestion = (roomId: string, kind: RoomEventKind) => {
    if (
      eventInteractionLockRef.current ||
      activeRoomEventRef.current?.phase === "question" ||
      activeRoomEventRef.current?.phase === "review" ||
      roomProgressRef.current[roomId]?.eventCompleted
    ) {
      return;
    }
    eventInteractionLockRef.current = true;
    const room = getDungeonRoom(roomId);
    const config =
      kind === "treasure"
        ? requireTreasureConfig(room)
        : requireTrapConfig(room);
    const questions = getDungeonQuestionSet(config.questionSetId, 1);
    pendingRoomEventResultRef.current = null;
    updateActiveRoomEvent({ roomId, kind, phase: "question" });
    setActiveQuestions(questions);
    setDungeonMode("roomEvent");
    window.setTimeout(() => {
      eventInteractionLockRef.current = false;
    }, 0);
  };

  const investigateTreasure = () => {
    const event = activeRoomEventRef.current;
    if (!event || event.kind !== "treasure" || event.phase !== "treasurePrompt") {
      return;
    }
    beginRoomEventQuestion(event.roomId, "treasure");
  };

  const advanceTrapIntroduction = () => {
    const event = activeRoomEventRef.current;
    if (
      !event ||
      event.kind !== "trap" ||
      eventInteractionLockRef.current ||
      !event.phase.startsWith("trapIntro")
    ) {
      return;
    }
    eventInteractionLockRef.current = true;
    const next = advanceTrapIntro(event.phase);
    if (next.startsQuestion) {
      eventInteractionLockRef.current = false;
      beginRoomEventQuestion(event.roomId, "trap");
      return;
    }
    updateActiveRoomEvent({ ...event, phase: next.phase, message: next.message });
    window.setTimeout(() => {
      eventInteractionLockRef.current = false;
    }, 0);
  };

  const finishRoomEventAfterReview = () => {
    const event = activeRoomEvent;
    const result = pendingRoomEventResultRef.current;
    if (
      !event ||
      event.phase !== "review" ||
      !result ||
      eventResultProcessingRef.current
    ) {
      return;
    }
    eventResultProcessingRef.current = true;
    const room = getDungeonRoom(event.roomId);
    const resolution = resolveDungeonRoomEvent(room, result.isCorrect);
    if (resolution.damage > 0) {
      setPlayerHp((current) =>
        applyDungeonPlayerDamage(current, resolution.damage),
      );
      setFloatingText(`-${resolution.damage}`);
      setDamageFlash(true);
      window.setTimeout(() => {
        if (mountedRef.current) {
          setFloatingText(null);
          setDamageFlash(false);
        }
      }, 240);
    }
    const nextProgress = completeRoomEventWithResult(
      roomProgressRef.current,
      event.roomId,
      resolution.eventResult,
    );
    roomProgressRef.current = nextProgress;
    setRoomProgress(nextProgress);
    setExplorationMessage(resolution.message);
    updateActiveRoomEvent({
      ...event,
      phase: "result",
      isCorrect: result.isCorrect,
      message: resolution.message,
    });
  };

  const continueAfterRoomEvent = () => {
    if (!activeRoomEvent || activeRoomEvent.phase !== "result") {
      return;
    }
    pendingRoomEventResultRef.current = null;
    updateActiveRoomEvent(null);
    eventResultProcessingRef.current = false;
    setDungeonMode("exploration");
  };

  const handleRoomEntered = (roomId: string) => {
    if (roomEventProcessingRef.current) {
      return;
    }
    roomEventProcessingRef.current = true;
    setDungeonMode("roomEvent");
    try {
      const room = getDungeonRoom(roomId);
      const action = resolveRoomEntry(room, roomProgressRef.current[roomId]);
      if (action.type === "startCombat") {
        startCombatForRoom(roomId);
        return;
      }
      if (action.type === "startTrap") {
        const step = getTrapIntroStep("trapIntroFloor");
        updateActiveRoomEvent({
          roomId,
          kind: "trap",
          phase: step.phase,
          message: step.message,
        });
        return;
      }
      if (action.type === "showTreasure" && !roomProgressRef.current[roomId]?.eventCompleted) {
        const step = getTreasurePromptStep();
        updateActiveRoomEvent({
          roomId,
          kind: "treasure",
          phase: step.phase,
          message: step.message,
        });
        return;
      }
      setExplorationMessage(action.message);
      setDungeonMode("exploration");
    } finally {
      roomEventProcessingRef.current = false;
    }
  };

  const moveToConnectedRoom = (route: TraversableDungeonConnection) => {
    if (
      dungeonMode !== "exploration" ||
      movementProcessingRef.current ||
      activeCombatRoomIdRef.current
    ) {
      return;
    }
    const controller = visualsRef.current?.dungeonCamera;
    if (!controller) {
      return;
    }
    movementProcessingRef.current = true;
    setDungeonMode("moving");
    setExplorationMessage("복도를 따라 이동하는 중...");
    const sourceRoomId = currentRoomId;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    controller.moveAlongPath(route.cameraPath, {
      reducedMotion,
      mode: route.direction === "back" ? "backward" : "forward",
      onComplete: () => {
        if (!mountedRef.current || !movementProcessingRef.current) {
          return;
        }
        movementProcessingRef.current = false;
        setPreviousRoomId(sourceRoomId);
        setCurrentRoomId(route.targetRoomId);
        handleRoomEntered(route.targetRoomId);
      },
    });
  };

  const restartTestDungeon = () => {
    movementProcessingRef.current = false;
    roomEventProcessingRef.current = false;
    activeCombatRoomIdRef.current = null;
    pendingRoomEventResultRef.current = null;
    activeRoomEventRef.current = null;
    eventInteractionLockRef.current = false;
    eventResultProcessingRef.current = false;
    dungeonCompletionProcessingRef.current = false;
    const nextProgress = createInitialRoomProgress(TEST_DUNGEON_MAP);
    roomProgressRef.current = nextProgress;
    setRoomProgress(nextProgress);
    setActiveCombatRoomId(null);
    setActiveRoomEvent(null);
    setPreviousRoomId(null);
    setCurrentRoomId(TEST_DUNGEON_MAP.startRoomId);
    setDungeonMode("exploration");
    setExplorationMessage("던전의 시작점이다.");
    initializeCombatEncounterState();
    setPlayerHp(MAX_HP);
    setSmallPotionQuantity(INITIAL_SMALL_POTION_QUANTITY);
    setMediumPotionQuantity(INITIAL_MEDIUM_POTION_QUANTITY);
    const startRoom = getDungeonRoom(TEST_DUNGEON_MAP.startRoomId);
    visualsRef.current?.dungeonCamera.setPose(startRoom.explorationCameraPose);
    visualsRef.current?.monster.reset();
    if (visualsRef.current) {
      visualsRef.current.monsterRoot.visible = false;
      visualsRef.current.sword.root.visible = true;
    }
  };

  const resultTitle =
    resolution?.outcome === "perfectVictory"
      ? "완벽한 승리"
      : resolution?.outcome === "hardVictory"
        ? "힘겨운 승리"
        : "전투 실패";
  const dialogueMode = dialogueModeForPhase(phase);
  const availableConnections = getConnectionsForRoom(currentRoomId).sort(
    (left, right) =>
      DIRECTION_ORDER.indexOf(left.direction) -
      DIRECTION_ORDER.indexOf(right.direction),
  );
  const animationInProgress = [
    "playerAttack",
    "enemyTurn",
    "finishingAttack",
    "victory",
    "enemyEscaped",
  ].includes(phase);
  const buttonsLocked = animationInProgress || interactionLocked;
  const currentRoom = getDungeonRoom(currentRoomId);
  const currentRoomProgress = roomProgress[currentRoomId];
  const treasureVisible = currentRoom.type === "treasure";
  const trapIntroVisible =
    activeRoomEvent?.kind === "trap" &&
    (activeRoomEvent.phase === "trapIntroReveal" ||
      activeRoomEvent.phase === "trapIntroChallenge");
  const roomEventImage =
    treasureVisible
      ? currentRoomProgress?.eventResult === "treasureOpened"
        ? treasureOpenUrl
        : treasureClosedUrl
      : activeRoomEvent?.kind === "trap" &&
          activeRoomEvent.phase !== "trapIntroFloor"
        ? activeRoomEvent.phase === "result"
          ? activeRoomEvent.isCorrect
            ? null
            : trapTriggeredUrl
          : trapIdleUrl
        : null;
  const playerStatusBar = <PlayerStatusBar {...playerState} />;
  const combatStatusBar = (
    <PlayerStatusBar
      {...playerState}
      questionLabel={`${Math.min(questionIndex + 1, 2)} / 2`}
    />
  );

  return (
    <main
      className={`game-screen dungeon-screen ${criticalEffect ? "is-critical-impact" : ""}`}
    >
      <div
        ref={sceneContainerRef}
        className="dungeon-scene"
        aria-label="고정 테스트 던전"
      />
      <div className={`combat-damage-flash ${damageFlash ? "is-active" : ""}`} />
      <div
        className={`combat-critical-accent ${criticalEffect ? "is-active" : ""}`}
        aria-hidden="true"
      />
      {dungeonMode === "combat" && enemyStunned && (
        <div
          className="monster-stun-indicator"
          role="status"
          aria-label="마늘킹 기절"
        >
          <span aria-hidden="true">★ ✦ ★</span>
          <strong>기절</strong>
        </div>
      )}
      {dungeonMode === "combat" && floatingText && (
        <strong className={`combat-floating-text ${
          floatingText.startsWith("+")
            ? "is-heal"
            : `is-${floatingText.toLowerCase()}`
        }`}>
          {floatingText}
        </strong>
      )}

      {roomEventImage && (
        <div className="dungeon-room-event-image" aria-hidden="true">
          <img
            src={roomEventImage}
            alt=""
            className={`${activeRoomEvent?.kind === "trap" ? "is-trap" : "is-treasure"} ${
              trapIntroVisible ? "is-revealing" : ""
            }`}
          />
        </div>
      )}

      {activeRoomEvent &&
        (activeRoomEvent.phase === "treasurePrompt" ||
          activeRoomEvent.phase.startsWith("trapIntro")) && (
          <CombatDialoguePanel
            mode="message"
            busy={eventInteractionLockRef.current}
            statusBar={playerStatusBar}
          >
            <div className="combat-message-layout">
              <p className="combat-message" role="status">
                {activeRoomEvent.message}
              </p>
              <button
                type="button"
                className="combat-message-next"
                onClick={
                  activeRoomEvent.phase === "treasurePrompt"
                    ? investigateTreasure
                    : advanceTrapIntroduction
                }
              >
                {activeRoomEvent.phase === "treasurePrompt" ? "조사하기" : "다음"}
              </button>
            </div>
          </CombatDialoguePanel>
        )}

      {activeRoomEvent &&
        (activeRoomEvent.phase === "question" ||
          activeRoomEvent.phase === "review") && (
          <section
            className="dungeon-room-event-panel is-question"
            aria-label={activeRoomEvent.kind === "treasure" ? "보물상자 문제" : "함정 문제"}
          >
            <QuestionScreen
              key={`${activeRoomEvent.roomId}-${activeRoomEvent.kind}`}
              embedded
              eyebrow={activeRoomEvent.kind === "treasure" ? "TREASURE QUESTION" : "TRAP QUESTION"}
              questions={activeQuestions}
              onNavigate={onNavigate}
              onReviewChange={(result) => {
                pendingRoomEventResultRef.current = result;
                const current = activeRoomEventRef.current;
                if (current) {
                  updateActiveRoomEvent({ ...current, phase: "review" });
                }
              }}
              onResult={(result) => {
                pendingRoomEventResultRef.current = result;
              }}
              onComplete={finishRoomEventAfterReview}
            />
          </section>
        )}

      {activeRoomEvent?.phase === "result" && (
        <CombatDialoguePanel mode="result" busy={false} statusBar={playerStatusBar}>
          <div className="combat-message-layout" role="status">
            <p className="eyebrow">
              {activeRoomEvent.kind === "treasure" ? "TREASURE RESULT" : "TRAP RESULT"}
            </p>
            <p className="combat-message">{activeRoomEvent.message}</p>
            {activeRoomEvent.kind === "treasure" && activeRoomEvent.isCorrect && (
              <p>보물을 획득했다!</p>
            )}
            <button
              type="button"
              className="combat-message-next"
              onClick={continueAfterRoomEvent}
            >
              다음
            </button>
          </div>
        </CombatDialoguePanel>
      )}

      {dungeonMode === "combat" && <section className="dungeon-overlay">
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
      </section>}

      {dungeonMode === "combat" && <CombatDialoguePanel
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
                    onClick={openItemSelect}
                    disabled={
                      mustAttackNextTurn ||
                      playerHp >= MAX_HP ||
                      (smallPotionQuantity <= 0 &&
                        mediumPotionQuantity <= 0)
                    }
                    title={
                      mustAttackNextTurn
                        ? "이번 턴에는 공격해야 합니다."
                        : playerHp >= MAX_HP
                          ? "HP가 가득 차 있습니다."
                          : undefined
                    }
                  >
                    아이템
                    {mustAttackNextTurn && (
                      <small>이번 턴에는 공격해야 합니다.</small>
                    )}
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
            {phase === "itemSelect" && (
              <div className="combat-item-panel" aria-label="아이템 선택">
                {(
                  [
                    ["smallPotion", smallPotionQuantity],
                    ["mediumPotion", mediumPotionQuantity],
                  ] as const
                ).map(([kind, quantity]) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={quantity <= 0 || playerHp >= MAX_HP}
                    onClick={() => selectPotion(kind)}
                  >
                    <strong>{potionName(kind)}</strong>
                    <span>HP +{getPotionHealAmount(kind)}</span>
                    <small>보유 {quantity}개</small>
                  </button>
                ))}
                <button type="button" onClick={cancelItemSelect}>뒤로</button>
              </div>
            )}
            {phase === "awaitItemUse" && selectedPotion && (
              <div className="combat-item-confirm">
                <p>
                  {potionName(selectedPotion)} · HP +
                  {getPotionHealAmount(selectedPotion)} · 보유{" "}
                  {potionQuantity(selectedPotion)}개
                </p>
                <div>
                  <button type="button" onClick={confirmPotionUse}>사용</button>
                  <button type="button" onClick={cancelItemSelect}>취소</button>
                </div>
              </div>
            )}
            {[
              "itemUse",
              "awaitHealResult",
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
            key={`${activeCombatRoomId ?? "none"}-${questionIndex}`}
            embedded
            eyebrow={`QUESTION ${questionIndex + 1}`}
            questions={[activeQuestions[questionIndex]]}
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
              <button
                type="button"
                onClick={() => continueExplorationAfterResult()}
              >
                이동 계속하기
              </button>
              {import.meta.env.DEV && (
                <button type="button" onClick={resetCombat}>이 전투 다시 테스트</button>
              )}
              <button type="button" onClick={tryCompleteDungeon}>
                던전 완료하고 베이스캠프로 돌아가기
              </button>
              <button type="button" onClick={() => onNavigate("title")}>타이틀로 돌아가기</button>
            </div>
          </div>
        )}
      </CombatDialoguePanel>}

      {(dungeonMode === "exploration" || dungeonMode === "moving") && (
        <section className="dungeon-movement-panel" aria-label="던전 이동 선택">
          <p className="eyebrow">DUNGEON EXPLORATION</p>
          <p className="dungeon-movement-message" role="status">
            {explorationMessage}
          </p>
          <h2>어느 길로 이동할까?</h2>
          <div className="dungeon-direction-buttons">
            {availableConnections.map((route) => (
              <button
                key={route.connection.id}
                type="button"
                disabled={dungeonMode === "moving"}
                aria-label={`${DIRECTION_LABELS[route.direction]}: ${route.targetRoomId}`}
                onClick={() => moveToConnectedRoom(route)}
              >
                {DIRECTION_LABELS[route.direction]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dungeon-reset-button"
            disabled={dungeonMode === "moving"}
            onClick={restartTestDungeon}
          >
            던전 처음부터 다시 시작
          </button>
          {import.meta.env.DEV && (
            <small className="dungeon-debug">
              current: {currentRoomId} · previous: {previousRoomId ?? "none"} ·
              mode: {dungeonMode} · completed:{" "}
              {Object.values(roomProgress)
                .filter((progress) => progress.eventCompleted)
                .map((progress) => progress.roomId)
                .join(", ") || "none"}
            </small>
          )}
          <footer className="dungeon-movement-status">
            {playerStatusBar}
          </footer>
        </section>
      )}
    </main>
  );
}
