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
import { runEliteCombatChecks } from "../../game/combat/eliteCombatChecks";
import { runDungeonMapChecks } from "../../game/dungeon/dungeonMapChecks";
import { runDungeonCameraChecks } from "../../game/dungeon/dungeonCameraChecks";
import { runDungeonCompletionChecks } from "../../game/dungeon/dungeonCompletionChecks";
import {
  getDungeonQuestionSet,
  runDungeonQuestionChecks,
} from "../../game/dungeon/dungeonQuestionSets";
import {
  completeRoomEvent,
  completeRoomEventWithResult,
  restoreRoomProgress,
  shouldCompleteCombatRoom,
  shouldCompleteEliteRoom,
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
import { applyDungeonPlayerHealing } from "../../game/dungeon/dungeonPlayerState";
import { runDungeonPlayerStateChecks } from "../../game/dungeon/dungeonPlayerStateChecks";
import { runEliteRoomChecks } from "../../game/dungeon/eliteRoomChecks";
import {
  getConnectionsForRoomFromMap,
  getDungeonRoomFromMap,
} from "../../game/dungeon/dungeonRuntimeMap";
import { createFloor1DungeonRun } from "../../game/dungeon/generation/floor1DungeonRuntime";
import type {
  DungeonDirection,
  DungeonFloorRunState,
  DungeonRoomProgress,
  TraversableDungeonConnection,
} from "../../game/dungeon/dungeonTypes";
import {
  DUNGEON_CANONICAL_YAW,
  buildDungeonNavigationPath,
} from "../../game/dungeon/navigation/dungeonNavigationPathBuilder";
import { labelDungeonNavigationRoutes } from "../../game/dungeon/navigation/dungeonNavigationLabelResolver";
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
import {
  ELITE_COMBAT_QUESTION_COUNT,
  resolveEliteCombat,
  type EliteCombatResolution,
} from "../../game/combat/eliteCombatResolver";
import {
  getMonsterVisualDefinition,
  type MonsterVisualDefinition,
} from "../../game/monster/monsterDefinitions";
import type { QuestionResult } from "../../types/question";
import { QuestionScreen } from "../QuestionScreen/QuestionScreen";
import { MonsterAnimationController } from "../../three/monster/MonsterAnimationController";
import { DungeonCameraController } from "../../three/dungeon/DungeonCameraController";
import {
  getSwordDefinitionForEquippedItem,
  SwordViewModel,
} from "../../three/weapon/SwordViewModel";
import {
  WeaponAnimationController,
  type WeaponAttackType,
} from "../../three/weapon/WeaponAnimationController";
import { PlayerStatusBar } from "../../components/PlayerStatusBar";
import { ItemIcon } from "../../components/ItemIcon";
import { getItemDefinition } from "../../game/inventory/itemDefinitions";
import type { PlayerState } from "../../game/player/playerState";
import type { Dispatch, SetStateAction } from "react";
import { resolvePlayerDamage } from "../../game/player/playerDamageResolver";
import { DungeonExitButton } from "../../components/DungeonExitButton";
import { DungeonExitConfirmDialog } from "../../components/DungeonExitConfirmDialog";
import { PlayerDefeatedOverlay } from "../../components/PlayerDefeatedOverlay";
import { loadDungeonTextureSet, disposeDungeonTextureSet } from "../../three/dungeon/visuals/dungeonTextureRegistry";
import { assembleDungeonVisuals } from "../../three/dungeon/visuals/DungeonVisualAssembler";
import { FLOOR1_STANDARD_ROOM } from "../../three/dungeon/visuals/roomVisualTemplates";
import { FLOOR1_STANDARD_CORRIDOR } from "../../three/dungeon/visuals/corridorTemplates";
import type { DungeonVisualAssembly } from "../../three/dungeon/visuals/dungeonVisualTypes";
import {
  DUNGEON_EVENT_VISUAL_PLACEMENT,
  applyDungeonEventVisualVerticalOffset,
} from "../../game/dungeon/dungeonEventVisualPlacement";
import { resolveDungeonExitButtonState } from "../../game/dungeon/dungeonExitButtonResolver";
import { allocateDungeonRunQuestions } from "../../game/dungeon/dungeonRunQuestionAllocator";
import { resolveDungeonGoldDrop } from "../../game/dungeon/dungeonGoldDropResolver";
import { changeItemQuantity, getItemQuantity, type InventoryState } from "../../game/inventory/inventoryState";
import { DungeonReturnPrompt, MemoryFragmentEvent } from "../../components/MemoryFragmentEvent";
import { TornClothEvent } from "../../components/TornClothEvent";
import memoryFoundUrl from "../../assets/quest/memory-fragment-found.png";
import tornClothFoundUrl from "../../assets/quest/torn-cloth-found.png";
import {
  getFloorNumber,
  getMonsterDamageForFloor,
  getTrapDamageForFloor,
  getWrongAnswerDamageForFloor,
} from "../../game/balance/floorBalance";
import { DungeonMinimap } from "../../components/DungeonMinimap";
import { DungeonFloorIntro } from "../../components/DungeonFloorIntro";
import {
  canEnterFinalRoom,
  isFinalRoom,
} from "../../game/dungeon/dungeonExplorationResolver";
import type { FloorId } from "../../game/floor/floorTypes";

type DungeonScreenProps = {
  floorId: FloorId;
  onNavigate: (screen: ScreenId) => void;
  playerState: PlayerState;
  setPlayerState: Dispatch<SetStateAction<PlayerState>>;
  onDungeonEntered: () => void;
  onDungeonAbandoned: () => void;
  onFloorCleared: () => void;
  onGoldAwarded: () => void;
  inventoryState: InventoryState;
  setInventoryState: Dispatch<SetStateAction<InventoryState>>;
  onInventoryChanged: () => void;
  firstObjectiveEventSeen: boolean;
  onObjectiveAcquired: (correctCount: number) => void;
  onBestCorrect: (correctCount: number) => void;
  floorQuestStarted: boolean;
  savedFloorRun: DungeonFloorRunState | null;
  onFloorRunChanged: (run: DungeonFloorRunState) => void;
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
  monsterMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  monsterTexture: THREE.Texture;
  camera: THREE.PerspectiveCamera;
  dungeonCamera: DungeonCameraController;
};

type DungeonMode = "exploration" | "moving" | "roomEvent" | "combat";
type DungeonFailureState = "none" | "playerDefeated";
type CombatKind = "normal" | "elite";
type CombatResolution = NormalCombatResolution | EliteCombatResolution;
type RoomEventKind = "treasure" | "trap";
type ActiveRoomEvent = {
  roomId: string;
  kind: RoomEventKind;
  phase: DungeonEventFlowPhase;
  isCorrect?: boolean;
  message?: string;
};

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
  floorId,
  onNavigate,
  playerState,
  setPlayerState,
  onDungeonEntered,
  onDungeonAbandoned,
  onFloorCleared,
  onGoldAwarded,
  inventoryState,
  setInventoryState,
  onInventoryChanged,
  firstObjectiveEventSeen,
  onObjectiveAcquired,
  onBestCorrect,
  floorQuestStarted,
  savedFloorRun,
  onFloorRunChanged,
}: DungeonScreenProps) {
  const activeFloorNumber = getFloorNumber(floorId);
  const [dungeonRun] = useState(() =>
    createFloor1DungeonRun(
      savedFloorRun?.floorId === floorId
        ? savedFloorRun.seed
        : undefined,
    ),
  );
  const dungeonMap = dungeonRun.map;
  const maxHp = playerState.maxHp;
  const [runQuestionAssignments] = useState(() =>
    allocateDungeonRunQuestions(dungeonRun.map, dungeonRun.seed),
  );
  const getDungeonRoom = (roomId: string) =>
    getDungeonRoomFromMap(dungeonMap, roomId);
  const getConnectionsForRoom = (roomId: string) =>
    getConnectionsForRoomFromMap(dungeonMap, roomId);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const visualsRef = useRef<CombatVisuals | null>(null);
  const visualAssemblyRef = useRef<DungeonVisualAssembly | null>(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const interactionLockRef = useRef(false);
  const enemyTurnProcessingRef = useRef(false);
  const resultFinalizedRef = useRef(false);
  const rewardedCombatRoomIdsRef = useRef(new Set<string>());
  const pendingResultRef = useRef<QuestionResult | null>(null);
  const weaponResultRef = useRef<WeaponAttackType | null>(null);
  const answersRef = useRef<boolean[]>([]);
  const runCorrectCountRef = useRef(0);
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
  const resumeRoomEntryRef = useRef<(roomId: string) => void>(() => {});
  const activeCombatRoomIdRef = useRef<string | null>(null);
  const activeCombatKindRef = useRef<CombatKind>("normal");
  const pendingRoomEventResultRef = useRef<QuestionResult | null>(null);
  const activeRoomEventRef = useRef<ActiveRoomEvent | null>(null);
  const eventInteractionLockRef = useRef(false);
  const eventResultProcessingRef = useRef(false);
  const defeatProcessingRef = useRef(false);
  const dungeonExitProcessingRef = useRef(false);
  const playerHpRef = useRef(playerState.currentHp);
  const activeQuestionsRef = useRef(
    getDungeonQuestionSet("normal-garlic-a"),
  );
  const roomProgressRef = useRef<Record<string, DungeonRoomProgress>>(
    restoreRoomProgress(
      dungeonMap,
      savedFloorRun?.floorId === floorId
        ? savedFloorRun.roomProgress
        : undefined,
    ),
  );

  const [phase, setPhase] = useState<NormalCombatPhase>("intro");
  const [floorIntroVisible, setFloorIntroVisible] = useState(true);
  const [dungeonMode, setDungeonMode] = useState<DungeonMode>("exploration");
  const [currentRoomId, setCurrentRoomId] = useState(
    savedFloorRun?.floorId === floorId &&
      dungeonMap.rooms.some((room) => room.id === savedFloorRun.currentRoomId)
      ? savedFloorRun.currentRoomId
      : dungeonMap.startRoomId,
  );
  const [previousRoomId, setPreviousRoomId] = useState<string | null>(null);
  const [activeCombatRoomId, setActiveCombatRoomId] = useState<string | null>(
    null,
  );
  const [activeCombatKind, setActiveCombatKind] =
    useState<CombatKind>("normal");
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
  const [, setActualEnemyAttackCount] = useState(0);
  const [, setSkippedEnemyAttackCount] = useState(0);
  const [, setHasCriticalOccurred] = useState(false);
  const [enemyStunned, setEnemyStunned] = useState(false);
  const [criticalEffect, setCriticalEffect] = useState(false);
  const [forceCriticalNextAttack, setForceCriticalNextAttack] = useState(false);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [smallPotionQuantity, setSmallPotionQuantity] = useState(
    getItemQuantity(inventoryState, "potion-small"),
  );
  const [mediumPotionQuantity, setMediumPotionQuantity] = useState(
    getItemQuantity(inventoryState, "potion-medium"),
  );
  const [selectedPotion, setSelectedPotion] = useState<PotionKind | null>(null);
  const [mustAttackNextTurn, setMustAttackNextTurn] = useState(false);
  const [combatMessage, setCombatMessage] = useState(
    "마늘킹이 나타났다!",
  );
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [resolution, setResolution] =
    useState<CombatResolution | null>(null);
  const [goldDrop, setGoldDrop] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState(
    activeQuestionsRef.current,
  );
  const [activeRoomEvent, setActiveRoomEvent] =
    useState<ActiveRoomEvent | null>(null);
  const [failureState, setFailureState] =
    useState<DungeonFailureState>("none");
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [runActionBusy, setRunActionBusy] = useState(false);
  const [objectiveEvent, setObjectiveEvent] = useState<"first" | "retry" | null>(null);
  const [finalGateDialogueStep, setFinalGateDialogueStep] =
    useState<0 | 1 | null>(null);

  const combatQuestionCount =
    activeCombatKind === "elite" ? ELITE_COMBAT_QUESTION_COUNT : 2;
  const activeMonsterDefinition = (): MonsterVisualDefinition => {
    const roomId = activeCombatRoomIdRef.current;
    if (!roomId) {
      return getMonsterVisualDefinition("garlic-king");
    }
    const room = getDungeonRoom(roomId);
    return getMonsterVisualDefinition(
      room.type === "elite"
        ? room.eliteConfig!.monsterId
        : room.combatConfig!.monsterId,
    );
  };
  const activeMonsterName = () => activeMonsterDefinition().name;
  const activeEnemyAttackDamage = () => {
    const lastAnswerWasWrong =
      !enemyTurnFromItemRef.current &&
      answersRef.current.length > 0 &&
      answersRef.current[answersRef.current.length - 1] === false;
    if (lastAnswerWasWrong) {
      return getWrongAnswerDamageForFloor(activeFloorNumber);
    }
    const roomId = activeCombatRoomIdRef.current;
    if (!roomId) {
      return getMonsterDamageForFloor(activeFloorNumber);
    }
    const room = getDungeonRoom(roomId);
    return getMonsterDamageForFloor(
      activeFloorNumber,
      room.type === "elite" ? "elite" : "normal",
    );
  };
  const resolveCurrentCombat = (): CombatResolution =>
    activeCombatKindRef.current === "elite"
      ? resolveEliteCombat({
          answers: answersRef.current.map((isCorrect) => ({ isCorrect })),
        })
      : resolveNormalCombat(answersRef.current as [boolean, boolean]);
  const resolutionOutcome = (value: CombatResolution) =>
    "result" in value ? value.result : value.outcome;

  playerHpRef.current = playerHp;

  const enterDefeatedState = () => {
    if (defeatProcessingRef.current) return;
    defeatProcessingRef.current = true;
    interactionLockRef.current = true;
    setInteractionLocked(true);
    setExitConfirmOpen(false);
    setFailureState("playerDefeated");
  };

  const applyPlayerDamage = (damage: number) => {
    const result = resolvePlayerDamage(playerHpRef.current, damage);
    playerHpRef.current = result.nextHp;
    setPlayerHp(result.nextHp);
    return result;
  };

  useEffect(() => {
    onDungeonEntered();
    const timer = window.setTimeout(() => setFloorIntroVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  const minimapVisible =
    (dungeonMode === "exploration" || dungeonMode === "moving") &&
    failureState === "none" &&
    !exitConfirmOpen &&
    objectiveEvent === null &&
    finalGateDialogueStep === null;

  useEffect(() => {
    onFloorRunChanged({
      floorId,
      seed: dungeonRun.seed,
      currentRoomId,
      roomProgress,
      minimapVisible,
    });
  }, [
    currentRoomId,
    dungeonRun.seed,
    minimapVisible,
    onFloorRunChanged,
    roomProgress,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    if (import.meta.env.DEV) {
      runNormalCombatChecks();
      runCriticalChecks();
      runPotionChecks();
      runEliteCombatChecks();
      runDungeonMapChecks();
      runDungeonCameraChecks();
      runDungeonQuestionChecks(dungeonMap);
      runDungeonCompletionChecks();
      runDungeonRoomEventChecks();
      runDungeonEventFlowChecks();
      runDungeonPlayerStateChecks();
      runEliteRoomChecks();
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
    visualAssemblyRef.current?.setActiveRoom(currentRoomId);
  }, [currentRoomId]);

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
    const monsterPosition =
      room.type === "elite"
        ? room.eliteConfig?.monsterPosition
        : room.combatConfig?.monsterPosition;
    if (!monsterPosition) {
      return;
    }
    monsterPositionTargetRef.current = new THREE.Vector3(
      ...applyDungeonEventVisualVerticalOffset(monsterPosition),
    );
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
    const initialRoom = getDungeonRoom(currentRoomId);
    camera.position.set(...initialRoom.explorationCameraPose.position);
    camera.lookAt(...initialRoom.explorationCameraPose.lookAt);
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

    const buildLegacyWorld = () => dungeonMap.rooms.forEach((roomNode, index) => {
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
    const buildLegacyCorridors = () => dungeonMap.connections.forEach((connection) => {
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
    let visualAssembly: ReturnType<typeof assembleDungeonVisuals> | null = null;
    let dungeonTextures: Awaited<ReturnType<typeof loadDungeonTextureSet>> | null = null;
    let visualCancelled = false;
    loadDungeonTextureSet()
      .then((textures) => {
        if (visualCancelled) {
          disposeDungeonTextureSet(textures);
          return;
        }
        dungeonTextures = textures;
        visualAssembly = assembleDungeonVisuals({
          dungeonMap,
          roomTemplate: FLOOR1_STANDARD_ROOM,
          corridorTemplate: FLOOR1_STANDARD_CORRIDOR,
          textures,
        });
        visualAssembly.setActiveRoom(currentRoomId);
        visualAssemblyRef.current = visualAssembly;
        scene.add(visualAssembly.root);
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn("[DungeonVisual] falling back", error);
        buildLegacyWorld();
        buildLegacyCorridors();
        scene.add(dungeonWorld);
      });

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
      monsterMesh: monster,
      monsterTexture,
      camera,
      dungeonCamera,
    };
    if (
      savedFloorRun?.floorId === floorId &&
      currentRoomId !== dungeonMap.startRoomId
    ) {
      window.setTimeout(() => {
        if (mountedRef.current) resumeRoomEntryRef.current(currentRoomId);
      }, 0);
    }

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
    sword.setDefinition(
      getSwordDefinitionForEquippedItem(
        inventoryState.equippedItemIds.weaponSkin,
      ),
      camera.aspect,
    );
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
      visualCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateViewport);
      const activeMonsterTexture = visualsRef.current?.monsterTexture;
      visualsRef.current = null;
      dungeonCamera.dispose();
      monsterAnimation.dispose();
      weapon.dispose();
      sword.dispose();
      monsterTexture.dispose();
      if (activeMonsterTexture && activeMonsterTexture !== monsterTexture) {
        activeMonsterTexture.dispose();
      }
      monsterBillboard.removeFromParent();
      monster.removeFromParent();
      monsterGeometry.dispose();
      monsterMaterial.dispose();
      scene.remove(dungeonWorld);
      visualAssembly?.dispose();
      visualAssemblyRef.current = null;
      if (dungeonTextures) disposeDungeonTextureSet(dungeonTextures);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const applyMonsterVisual = (
    definition: MonsterVisualDefinition,
  ): Promise<void> => {
    const visuals = visualsRef.current;
    if (!visuals) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      new THREE.TextureLoader().load(
        definition.image,
        (texture) => {
          if (!visualsRef.current) {
            texture.dispose();
            resolve();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          const previousTexture = visuals.monsterTexture;
          visuals.monsterTexture = texture;
          visuals.monsterMesh.material.map = texture;
          visuals.monsterMesh.material.needsUpdate = true;
          visuals.monsterMesh.scale.set(
            definition.displayScale *
              (definition.aspectRatio / MONSTER_TEXTURE_ASPECT),
            definition.displayScale,
            1,
          );
          visuals.monsterMesh.position.set(...definition.anchor);
          if (previousTexture !== texture) {
            previousTexture.dispose();
          }
          resolve();
        },
        undefined,
        () => resolve(),
      );
    });
  };

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
      const enemyName = activeMonsterName();
      const attackDamage = activeEnemyAttackDamage();
      setCombatMessage(`${enemyName}의 공격!`);
      await visualsRef.current?.monster.play("attack", () => {
        if (!mountedRef.current) {
          return;
        }
        const damageResult = applyPlayerDamage(attackDamage);
        if (damageResult.isDefeated) {
          defeatProcessingRef.current = true;
        }
        setActualEnemyAttackCount((current) => current + 1);
        setFloatingText(`-${attackDamage}`);
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
      if (playerHpRef.current === 0) {
        defeatProcessingRef.current = false;
        enterDefeatedState();
        return;
      }
      setPhase("awaitDamageResult");
      setCombatMessage(`${attackDamage}의 피해를 입었다.`);
    } finally {
      enemyTurnProcessingRef.current = false;
    }
  };

  const showResult = (finalResolution: CombatResolution) => {
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
      resolutionOutcome(finalResolution) === "perfectVictory" &&
      !rewardedCombatRoomIdsRef.current.has(combatRoomId)
    ) {
      const amount = resolveDungeonGoldDrop(
        dungeonRun.seed,
        combatRoomId,
        activeCombatKindRef.current,
        activeFloorNumber,
      );
      rewardedCombatRoomIdsRef.current.add(combatRoomId);
      setGoldDrop(amount);
      setPlayerState((current) => ({ ...current, gold: current.gold + amount }));
      onGoldAwarded();
    }
    if (
      combatRoomId &&
      ((getDungeonRoom(combatRoomId).type === "combat" &&
        "outcome" in finalResolution &&
        shouldCompleteCombatRoom(finalResolution.outcome)) ||
        (getDungeonRoom(combatRoomId).type === "elite" &&
          "result" in finalResolution &&
          shouldCompleteEliteRoom(finalResolution.result)))
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

  const playVictory = async () => {
    const finalResolution = resolveCurrentCombat();
    setPhase("victory");
    setCombatMessage(`${activeMonsterName()}을 쓰러뜨렸다!`);
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
    setCombatMessage(`${playerState.name || DEFAULT_PLAYER_NAME}의 공격!`);
    setFloatingText(null);
  };

  const playPlayerAttack = async (isCorrect: boolean) => {
    setPhase("playerAttack");
    setCombatMessage(`${playerState.name || DEFAULT_PLAYER_NAME}가 검을 휘두른다!`);
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
    const nextAnswers = [...answersRef.current, isCorrect];
    const isFinalQuestion = questionIndexRef.current >= combatQuestionCount - 1;
    const hasUpcomingEnemyTurn =
      !isFinalQuestion || nextAnswers.filter(Boolean).length < combatQuestionCount;
    criticalStateRef.current = applyCriticalResult(
      criticalStateRef.current,
      criticalResult,
      hasUpcomingEnemyTurn,
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
    if (questionIndexRef.current < combatQuestionCount - 1) {
      if (criticalStateRef.current.pendingSkipEnemyTurn) {
        setPhase("awaitStunSkip");
        setCombatMessage(`${activeMonsterName()}은 기절해서 움직일 수 없다!`);
      } else {
        setPhase("awaitEnemyTurn");
        setCombatMessage(`${activeMonsterName()}의 턴!`);
      }
      return;
    }

    const correctCount = answersRef.current.filter(Boolean).length;
    if (correctCount === combatQuestionCount) {
      criticalStateRef.current = {
        ...criticalStateRef.current,
        enemyStunned: false,
        pendingSkipEnemyTurn: false,
      };
      setEnemyStunned(false);
      await playVictory();
    } else if (criticalStateRef.current.pendingSkipEnemyTurn) {
      setPhase("awaitStunSkip");
      setCombatMessage(`${activeMonsterName()}은 기절해서 움직일 수 없다!`);
    } else {
      setPhase("awaitEnemyTurn");
      setCombatMessage(`${activeMonsterName()}의 턴!`);
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
      playerHp >= maxHp
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
      playerHp >= maxHp
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
      maxHp,
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
      setInventoryState((current) => changeItemQuantity(current, "potion-small", -1));
    } else {
      setMediumPotionQuantity(result.remainingQuantity);
      setInventoryState((current) => changeItemQuantity(current, "potion-medium", -1));
    }
    onInventoryChanged();
    setMustAttackNextTurn(true);
    setPhase("itemUse");
    setCombatMessage(
      `${playerState.name || DEFAULT_PLAYER_NAME}는 ${potionName(kind)}을 사용했다.`,
    );
  };

  const applyPotionHealing = () => {
    const result = pendingPotionResultRef.current;
    if (phase !== "itemUse" || !result) {
      return;
    }
    setPlayerHp((current) =>
      applyDungeonPlayerHealing(current, result.healedAmount, maxHp),
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
        setCombatMessage(`${activeMonsterName()}의 턴!`);
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
        if (questionIndexRef.current >= combatQuestionCount - 1) {
          pendingResultRef.current = null;
          setPhase("awaitEscape");
          setCombatMessage(`${activeMonsterName()}이 경계하며 뒤로 물러난다.`);
          processingRef.current = false;
          return;
        }
        const nextQuestionIndex = questionIndexRef.current + 1;
        questionIndexRef.current = nextQuestionIndex;
        setQuestionIndex(nextQuestionIndex);
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
        } else if (questionIndexRef.current < combatQuestionCount - 1) {
          const nextQuestionIndex = questionIndexRef.current + 1;
          questionIndexRef.current = nextQuestionIndex;
          setQuestionIndex(nextQuestionIndex);
          pendingResultRef.current = null;
          setPhase("playerCommand");
          setCombatMessage("무엇을 할까?");
          processingRef.current = false;
        } else {
          setPhase("awaitEscape");
          setCombatMessage(`${activeMonsterName()}이 경계하며 뒤로 물러난다.`);
        }
        itemProcessingRef.current = false;
        return;
      }

      if (phase === "awaitStagger") {
        setPhase("finishingAttack");
        setCombatMessage("마무리 공격!");
        await visualsRef.current?.monster.play("stagger");
        await playSword("finish");
        await playVictory();
        return;
      }

      if (phase === "awaitEscape") {
        const finalResolution = resolveCurrentCombat();
        setPhase("enemyEscaped");
        setCombatMessage(
          activeCombatKindRef.current === "elite"
            ? "정예 몬스터가 도망쳤다."
            : `${activeMonsterName()}이 달아난다.`,
        );
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
    setGoldDrop(0);
    setFloatingText(null);
    setDamageFlash(false);
    setCombatMessage(
      activeCombatKindRef.current === "elite"
        ? "정예 몬스터, 고인돌 골렘이 나타났다!"
        : "마늘킹이 나타났다!",
    );
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
    const combatKind: CombatKind = room.type === "elite" ? "elite" : "normal";
    const config =
      room.type === "elite" ? room.eliteConfig : room.combatConfig;
    if (!config) {
      throw new Error(`[DungeonScreen] Combat room ${roomId} has no config`);
    }
    const questions = runQuestionAssignments[roomId];
    if (!questions) {
      throw new Error(`[DungeonScreen] No run question assignment for ${roomId}`);
    }
    activeQuestionsRef.current = questions;
    setActiveQuestions(questions);
    activeCombatKindRef.current = combatKind;
    setActiveCombatKind(combatKind);
    activeCombatRoomIdRef.current = roomId;
    setActiveCombatRoomId(roomId);
    void applyMonsterVisual(getMonsterVisualDefinition(config.monsterId));
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    visualsRef.current?.dungeonCamera.transitionToPose(
      config.combatCameraPose,
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
    const questions = runQuestionAssignments[roomId];
    if (!questions || questions.length !== 1) {
      throw new Error(`[DungeonScreen] No unique run question assignment for ${roomId}`);
    }
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
    const eventDamage =
      event.kind === "trap" && !result.isCorrect
        ? getTrapDamageForFloor(activeFloorNumber)
        : resolution.damage;
    if (eventDamage > 0) {
      const damageResult = applyPlayerDamage(eventDamage);
      setFloatingText(`-${eventDamage}`);
      setDamageFlash(true);
      window.setTimeout(() => {
        if (mountedRef.current) {
          setFloatingText(null);
          setDamageFlash(false);
        }
      }, 240);
      if (damageResult.isDefeated) {
        enterDefeatedState();
        return;
      }
    }
    const nextProgress = completeRoomEventWithResult(
      roomProgressRef.current,
      event.roomId,
      resolution.eventResult,
    );
    roomProgressRef.current = nextProgress;
    setRoomProgress(nextProgress);
    let resultMessage = resolution.message;
    if (event.kind === "treasure" && result.isCorrect) {
      const amount = resolveDungeonGoldDrop(
        dungeonRun.seed,
        event.roomId,
        "treasure",
        activeFloorNumber,
      );
      setPlayerState((current) => ({ ...current, gold: current.gold + amount }));
      onGoldAwarded();
      resultMessage = `보물상자에서 ${amount} Gold를 획득했다!`;
    }
    setExplorationMessage(resultMessage);
    updateActiveRoomEvent({
      ...event,
      phase: "result",
      isCorrect: result.isCorrect,
      message: resultMessage,
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
      if (floorQuestStarted && (roomId === dungeonRun.generatedDungeon?.finalQuestRoomId || getDungeonRoom(roomId).type === "quest")) {
        setObjectiveEvent(firstObjectiveEventSeen ? "retry" : "first");
        return;
      }
      const room = getDungeonRoom(roomId);
      const action = resolveRoomEntry(room, roomProgressRef.current[roomId]);
      if (action.type === "startCombat" || action.type === "startEliteCombat") {
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
      if (
        (room.type === "empty" || room.type === "start") &&
        !roomProgressRef.current[roomId]?.eventCompleted
      ) {
        const nextProgress = completeRoomEvent(
          roomProgressRef.current,
          roomId,
        );
        roomProgressRef.current = nextProgress;
        setRoomProgress(nextProgress);
      }
      setExplorationMessage(action.message);
      setDungeonMode("exploration");
    } finally {
      roomEventProcessingRef.current = false;
    }
  };
  resumeRoomEntryRef.current = handleRoomEntered;

  const moveToConnectedRoom = (route: TraversableDungeonConnection) => {
    if (
      dungeonMode !== "exploration" ||
      movementProcessingRef.current ||
      activeCombatRoomIdRef.current
    ) {
      return;
    }
    if (
      isFinalRoom(dungeonMap, route.targetRoomId) &&
      !canEnterFinalRoom(dungeonMap, roomProgressRef.current)
    ) {
      setFinalGateDialogueStep(0);
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
    const targetRoom = getDungeonRoom(route.targetRoomId);
    const steps = buildDungeonNavigationPath({
      sourceRoom: getDungeonRoom(sourceRoomId),
      targetRoom,
      route,
    });
    controller.moveAlongSteps(steps, {
      reducedMotion,
      onComplete: () => {
        if (!mountedRef.current || !movementProcessingRef.current) {
          return;
        }
        controller.setPose({
          position: targetRoom.explorationCameraPose.position,
          lookAt: targetRoom.explorationCameraPose.lookAt,
          rotationY: DUNGEON_CANONICAL_YAW,
        });
        movementProcessingRef.current = false;
        setPreviousRoomId(sourceRoomId);
        setCurrentRoomId(route.targetRoomId);
        visualAssemblyRef.current?.setActiveRoom(route.targetRoomId);
        handleRoomEntered(route.targetRoomId);
      },
    });
  };

  const restartTestDungeon = (restoreHp = true) => {
    visualsRef.current?.dungeonCamera.cancel();
    movementProcessingRef.current = false;
    roomEventProcessingRef.current = false;
    activeCombatRoomIdRef.current = null;
    activeCombatKindRef.current = "normal";
    pendingRoomEventResultRef.current = null;
    activeRoomEventRef.current = null;
    eventInteractionLockRef.current = false;
    eventResultProcessingRef.current = false;
    defeatProcessingRef.current = false;
    dungeonExitProcessingRef.current = false;
    const nextProgress = restoreRoomProgress(dungeonMap, undefined);
    roomProgressRef.current = nextProgress;
    setRoomProgress(nextProgress);
    setActiveCombatRoomId(null);
    setActiveCombatKind("normal");
    setActiveRoomEvent(null);
    setPreviousRoomId(null);
    setCurrentRoomId(dungeonMap.startRoomId);
    setDungeonMode("exploration");
    setFailureState("none");
    setExitConfirmOpen(false);
    setRunActionBusy(false);
    setExplorationMessage("던전의 시작점이다.");
    initializeCombatEncounterState();
    interactionLockRef.current = false;
    setInteractionLocked(false);
    if (restoreHp) {
      playerHpRef.current = maxHp;
      setPlayerHp(maxHp);
    }
    setSmallPotionQuantity(getItemQuantity(inventoryState, "potion-small"));
    setMediumPotionQuantity(getItemQuantity(inventoryState, "potion-medium"));
    const startRoom = getDungeonRoom(dungeonMap.startRoomId);
    visualAssemblyRef.current?.setActiveRoom(dungeonMap.startRoomId);
    visualsRef.current?.dungeonCamera.setPose(startRoom.explorationCameraPose);
    visualsRef.current?.monster.reset();
    if (visualsRef.current) {
      visualsRef.current.monsterRoot.visible = false;
      visualsRef.current.sword.root.visible = true;
    }
  };

  const retryAfterDefeat = () => {
    if (dungeonExitProcessingRef.current) return;
    dungeonExitProcessingRef.current = true;
    setRunActionBusy(true);
    restartTestDungeon(true);
  };

  const returnAfterDefeat = () => {
    if (dungeonExitProcessingRef.current) return;
    dungeonExitProcessingRef.current = true;
    setRunActionBusy(true);
    restartTestDungeon(true);
    onDungeonAbandoned();
    onNavigate("baseCamp");
  };

  const openExitConfirm = () => {
    if (exitConfirmOpen || failureState !== "none" || dungeonExitProcessingRef.current) return;
    interactionLockRef.current = true;
    setInteractionLocked(true);
    setExitConfirmOpen(true);
  };

  const closeExitConfirm = () => {
    if (dungeonExitProcessingRef.current) return;
    setExitConfirmOpen(false);
    interactionLockRef.current = false;
    setInteractionLocked(false);
  };

  const abandonDungeon = () => {
    if (dungeonExitProcessingRef.current) return;
    dungeonExitProcessingRef.current = true;
    setRunActionBusy(true);
    restartTestDungeon(false);
    onDungeonAbandoned();
    onNavigate("baseCamp");
  };

  const currentResolutionOutcome = resolution
    ? resolutionOutcome(resolution)
    : null;
  const resultTitle =
    currentResolutionOutcome === "perfectVictory"
      ? activeCombatKind === "elite"
        ? "정예 몬스터를 쓰러뜨렸다!"
        : "완벽한 승리"
      : activeCombatKind === "elite"
        ? "정예 몬스터가 도망쳤다."
        : "몬스터가 도망쳤다.";
  const dialogueMode = dialogueModeForPhase(phase);
  const availableConnections = labelDungeonNavigationRoutes({
    currentRoom: getDungeonRoom(currentRoomId),
    routes: getConnectionsForRoom(currentRoomId),
    getRoom: getDungeonRoom,
  }).sort(
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
  const exitButtonState = resolveDungeonExitButtonState({
    failureState,
    isScreenTransitioning: runActionBusy && !exitConfirmOpen,
    isFloorClearTransitioning: false,
    exitConfirmOpen,
    isCameraMoving: dungeonMode === "moving",
    isEnemyAttackAnimating: animationInProgress,
    isAtomicResultProcessing:
      eventResultProcessingRef.current || roomEventProcessingRef.current,
  });
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
      questionLabel={`${Math.min(questionIndex + 1, combatQuestionCount)} / ${combatQuestionCount}`}
    />
  );

  return (
    <main
      className={`game-screen dungeon-screen ${criticalEffect ? "is-critical-impact" : ""} ${
        failureState !== "none" || exitConfirmOpen ? "has-blocking-modal" : ""
      }`}
    >
      <div
        ref={sceneContainerRef}
        className="dungeon-scene"
        aria-label="고정 테스트 던전"
      />
      {floorIntroVisible && <DungeonFloorIntro floorId={floorId} />}
      {exitButtonState.visible && (
        <DungeonExitButton
          disabled={exitButtonState.disabled}
          onClick={openExitConfirm}
        />
      )}
      {minimapVisible && (
        <DungeonMinimap
          map={dungeonMap}
          currentRoomId={currentRoomId}
          roomProgress={roomProgress}
        />
      )}
      <div className={`combat-damage-flash ${damageFlash ? "is-active" : ""}`} />
      <div
        className={`combat-critical-accent ${criticalEffect ? "is-active" : ""}`}
        aria-hidden="true"
      />
      {dungeonMode === "combat" && enemyStunned && (
        <div
          className="monster-stun-indicator"
          role="status"
          aria-label={`${activeMonsterName()} 기절`}
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
        <div
          className="dungeon-room-event-image"
          aria-hidden="true"
          style={{
            transform: `translateY(${DUNGEON_EVENT_VISUAL_PLACEMENT.overlayTranslateYPercent}%)`,
          }}
        >
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
                if (!pendingRoomEventResultRef.current && result.isCorrect) runCorrectCountRef.current += 1;
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
            <p className="eyebrow">
              {activeCombatKind === "elite" ? "ELITE COMBAT" : "NORMAL COMBAT"}
            </p>
            <h1>{activeMonsterName()}</h1>
            <small>
              {enemyStunned
                ? "기절"
                : phase === "enemyEscaped"
                ? "도주 중"
                : phase === "victory" || phase === "result"
                  ? "전투 종료"
                  : activeCombatKind === "elite"
                    ? "정예 몬스터"
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
                      playerHp >= maxHp ||
                      (smallPotionQuantity <= 0 &&
                        mediumPotionQuantity <= 0)
                    }
                    title={
                      mustAttackNextTurn
                        ? "이번 턴에는 공격해야 합니다."
                        : playerHp >= maxHp
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
                    disabled={quantity <= 0 || playerHp >= maxHp}
                    onClick={() => selectPotion(kind)}
                  >
                    <ItemIcon item={getItemDefinition(kind === "smallPotion" ? "potion-small" : "potion-medium")!} />
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
                if (result.isCorrect) runCorrectCountRef.current += 1;
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
            <p className="eyebrow">
              {activeCombatKind === "elite"
                ? "ELITE COMBAT RESULT"
                : "COMBAT RESULT"}
            </p>
            <h2 id="combat-result-title">{resultTitle}</h2>
            <dl>
              <div><dt>정답 수</dt><dd>{resolution.correctAnswerCount} / {combatQuestionCount}</dd></div>
              <div><dt>획득 Gold</dt><dd>{goldDrop} Gold</dd></div>
            </dl>
            <div className="button-group">
              <button
                type="button"
                onClick={() => continueExplorationAfterResult()}
              >
                이동 계속하기
              </button>
              <button type="button" onClick={() => onNavigate("title")}>타이틀로 돌아가기</button>
            </div>
          </div>
        )}
      </CombatDialoguePanel>}

      {!floorIntroVisible && (dungeonMode === "exploration" || dungeonMode === "moving") && (
        <section className="dungeon-movement-panel" aria-label="던전 이동 선택">
          <p className="eyebrow">DUNGEON EXPLORATION</p>
          {finalGateDialogueStep === null ? (
            <>
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
                onClick={() => restartTestDungeon()}
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
            </>
          ) : (
            <>
              <p className="dungeon-movement-message" role="status">
                {finalGateDialogueStep === 0
                  ? "아직 살펴보지 않은 곳이 있다."
                  : "모두 살펴봐야 들어갈 수 있을 것 같다."}
              </p>
              <button
                type="button"
                className="dungeon-reset-button"
                onClick={() =>
                  setFinalGateDialogueStep((current) =>
                    current === 0 ? 1 : null,
                  )
                }
              >
                {finalGateDialogueStep === 0 ? "다음" : "확인"}
              </button>
            </>
          )}
          <footer className="dungeon-movement-status">
            {playerStatusBar}
          </footer>
        </section>
      )}
      {exitConfirmOpen && failureState === "none" && (
        <DungeonExitConfirmDialog
          busy={runActionBusy}
          onCancel={closeExitConfirm}
          onConfirm={abandonDungeon}
        />
      )}
      {failureState === "playerDefeated" && (
        <PlayerDefeatedOverlay
          busy={runActionBusy}
          onRetry={retryAfterDefeat}
          onReturnToBaseCamp={returnAfterDefeat}
        />
      )}
      {objectiveEvent === "first" && floorId === "floor-1" && <MemoryFragmentEvent imageUrl={memoryFoundUrl} onComplete={() => {
        playerHpRef.current = maxHp;
        setPlayerHp(maxHp);
        setInventoryState((current) => changeItemQuantity(current, "quest-memory-fragment", 1));
        onObjectiveAcquired(runCorrectCountRef.current);
        onInventoryChanged();
        onNavigate("baseCamp");
      }} />}
      {objectiveEvent === "first" && floorId === "floor-2" && <TornClothEvent imageUrl={tornClothFoundUrl} onComplete={() => {
        playerHpRef.current = maxHp;
        setPlayerHp(maxHp);
        setInventoryState((current) => changeItemQuantity(current, "quest-torn-cloth", 1));
        onObjectiveAcquired(runCorrectCountRef.current);
        onInventoryChanged();
        onNavigate("baseCamp");
      }} />}
      {objectiveEvent === "retry" && <DungeonReturnPrompt onCancel={() => {
    setObjectiveEvent(null);
    setFinalGateDialogueStep(null);
        setDungeonMode("exploration");
      }} onConfirm={() => {
        playerHpRef.current = maxHp;
        setPlayerHp(maxHp);
        onBestCorrect(runCorrectCountRef.current);
        onFloorCleared();
        onNavigate("baseCamp");
      }} />}
    </main>
  );
}
