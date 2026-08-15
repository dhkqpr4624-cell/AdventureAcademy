import { useCallback, useEffect, useRef, useState } from "react";
import { BaseCampScreen } from "../screens/BaseCampScreen/BaseCampScreen";
import { DungeonScreen } from "../screens/DungeonScreen/DungeonScreen";
import { StoryScreen } from "../screens/StoryScreen/StoryScreen";
import { TitleScreen } from "../screens/TitleScreen/TitleScreen";
import { QuestionScreen } from "../screens/QuestionScreen/QuestionScreen";
import type { QuestionResult } from "../types/question";
import type { ScreenId } from "./routes";
import { runNpcChecks } from "../game/npc/npcChecks";
import { runQuestChecks } from "../game/quest/questChecks";
import { runPlayerStatusChecks } from "../components/playerStatusChecks";
import { runFloorUnlockChecks } from "../game/floor/floorUnlockChecks";
import { runQuestMarkerChecks } from "../game/quest/questMarkerChecks";
import { runBaseCampInteractionChecks } from "../game/baseCamp/baseCampInteractionChecks";
import { SaveManagementPanel } from "../components/SaveManagementPanel";
import { SaveManager } from "../save/SaveManager";
import { AutoSaveCoordinator } from "../save/AutoSaveCoordinator";
import { applySaveDataToGameState, createInitialGameSaveState, createSaveDataFromGameState, type GameSaveState } from "../save/saveStateAdapter";
import type { SaveReason } from "../save/saveTypes";
import { PlayerNamePopup } from "../components/PlayerNamePopup";
import {
  clearCollectionQuestEventFlags,
  getItemCollectionQuestRuleForFloor,
  removeCollectionQuestItems,
} from "../game/quest/itemCollectionQuestRules";
import { createDebugFloorJumpState } from "../debug/debugFloorJump";
import { changeItemQuantity } from "../game/inventory/inventoryState";
import { completeQuestStateAfterRewardClaim } from "../game/quest/questRewardCompletionResolver";

export function App() {
  const loaded = useRef(SaveManager.load());
  const initial = useRef(loaded.current.success ? applySaveDataToGameState(loaded.current.data) : createInitialGameSaveState());
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("title");
  const [, setQuestionResults] = useState<QuestionResult[]>([]);
  const [game, setGame] = useState<GameSaveState>(initial.current);
  const gameRef = useRef(game);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [namePopupOpen, setNamePopupOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState(loaded.current.success && loaded.current.source !== "main" ? "메인 세이브가 손상되어 최근 백업을 복구했습니다." : "");
  const startedAtRef = useRef(Date.now());
  const coordinatorRef = useRef<AutoSaveCoordinator | null>(null);
  gameRef.current = game;

  const snapshot = useCallback(() => createSaveDataFromGameState({
    ...gameRef.current,
    playTimeSeconds: gameRef.current.playTimeSeconds + Math.floor((Date.now() - startedAtRef.current) / 1000),
  }), []);
  const requestSave = useCallback((reason: SaveReason, immediate = false) => {
    if (immediate) coordinatorRef.current?.flush(reason);
    else coordinatorRef.current?.requestSave(reason);
  }, []);
  const navigate = useCallback((screen: ScreenId) => {
    setCurrentScreen(screen);
    if (screen === "baseCamp") requestSave("baseCampEntered");
  }, [requestSave]);
  const updateFloorRun = useCallback(
    (currentFloorRun: GameSaveState["currentFloorRun"]) => {
      setGame((current) => ({ ...current, currentFloorRun }));
    },
    [],
  );
  const hydrate = (data: ReturnType<typeof snapshot>) => {
    setGame(applySaveDataToGameState(data)); gameRef.current = applySaveDataToGameState(data);
    startedAtRef.current = Date.now(); setCurrentScreen("title");
  };
  const reset = () => {
    const next = createInitialGameSaveState(); setGame(next); gameRef.current = next;
    startedAtRef.current = Date.now(); setSettingsOpen(false); setCurrentScreen("title");
  };

  useEffect(() => {
    coordinatorRef.current = new AutoSaveCoordinator(snapshot, (result) => {
      if (!result.success) {
        if (import.meta.env.DEV) console.warn("[Save] non-fatal save failure", result);
        setSaveMessage((current) => current || "자동 저장에 실패했습니다. 게임은 계속 진행할 수 있습니다.");
      }
    });
    const interval = window.setInterval(() => requestSave("interval"), 30_000);
    const visibility = () => { if (document.visibilityState === "hidden") requestSave("visibilityHidden", true); };
    const pagehide = () => requestSave("pageHide", true);
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", pagehide);
    return () => {
      window.clearInterval(interval); document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide); coordinatorRef.current?.dispose(); coordinatorRef.current = null;
    };
  }, [requestSave, snapshot]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      runNpcChecks(); runQuestChecks(); runPlayerStatusChecks(); runFloorUnlockChecks(); runQuestMarkerChecks(); runBaseCampInteractionChecks();
      console.info("npc checks: PASS\nquest checks: PASS\nplayer status checks: PASS\nfloor unlock checks: PASS\nquest marker checks: PASS\nbase camp interaction checks: PASS");
    }
  }, []);

  const content = (() => {
    const activeFloorId = game.currentFloorId === "floor-5"
      ? "floor-5"
      : game.currentFloorId === "floor-4"
      ? "floor-4"
      : game.currentFloorId === "floor-3"
      ? "floor-3"
      : game.currentFloorId === "floor-2" ? "floor-2" : "floor-1";
    const activeFloorQuestId = activeFloorId === "floor-5"
      ? "quest-floor-5-unified-silla"
      : activeFloorId === "floor-4"
      ? "quest-floor-4-jeon-rescue"
      : activeFloorId === "floor-3"
      ? "quest-floor-3-torn-cloth"
      : activeFloorId === "floor-2"
        ? "quest-floor-2-memory-fragment"
        : "quest-floor-1-prehistory";
    switch (currentScreen) {
      case "story": return <StoryScreen playerName={game.playerState.name ?? ""} onNavigate={navigate} onStoryStarted={() => requestSave("storyStarted")} onStoryCompleted={(id) => {
        setGame((current) => ({ ...current, completedStoryIds: [...new Set([...current.completedStoryIds, id])] }));
        requestSave("storyCompleted");
        requestSave("introCompleted");
      }} onStoryCheckpoint={(id, checkpoint) => { setGame((current) => ({ ...current, checkpointByStoryId: { ...current.checkpointByStoryId, [id]: checkpoint } })); requestSave("storyCheckpoint"); }} />;
      case "baseCamp": return <BaseCampScreen
        onNavigate={navigate} playerState={game.playerState}
        onEnterDungeon={(floorId) => {
          setGame((current) => ({ ...current, currentFloorId: floorId }));
          navigate("dungeon");
        }}
        setPlayerState={(value) => setGame((current) => ({ ...current, playerState: typeof value === "function" ? value(current.playerState) : value }))}
        inventoryState={game.inventoryState}
        setInventoryState={(value) => setGame((current) => ({ ...current, inventoryState: typeof value === "function" ? value(current.inventoryState) : value }))}
        questState={game.questState} setQuestState={(value) => setGame((current) => ({ ...current, questState: typeof value === "function" ? value(current.questState) : value }))}
        floorUnlockState={game.floorUnlockState} setFloorUnlockState={(value) => setGame((current) => ({ ...current, floorUnlockState: typeof value === "function" ? value(current.floorUnlockState) : value }))}
        storyActionState={game.storyActionState} setStoryActionState={(value) => setGame((current) => ({ ...current, storyActionState: typeof value === "function" ? value(current.storyActionState) : value }))}
        onAutoSave={requestSave}
        onStoryCompleted={(id) => { setGame((current) => ({ ...current, completedStoryIds: [...new Set([...current.completedStoryIds, id])] })); requestSave("storyCompleted"); }}
        onStoryCheckpoint={(id, checkpoint) => { setGame((current) => ({ ...current, checkpointByStoryId: { ...current.checkpointByStoryId, [id]: checkpoint } })); requestSave("storyCheckpoint"); }}
        floorBestCorrect={game.floorBestCorrect}
        rewardClaimed={game.rewardClaimed}
        setRewardClaimed={(questId) => setGame((current) => ({ ...current, rewardClaimed: { ...current.rewardClaimed, [questId]: true } }))}
        rewardRevealed={game.firstObjectiveEventSeen}
        setRewardRevealed={(questId) => setGame((current) => ({ ...current, firstObjectiveEventSeen: { ...current.firstObjectiveEventSeen, [`reward-revealed:${questId}`]: true } }))}
        achievementReceived={game.achievementReceived}
        setAchievementReceived={(achievementId) => setGame((current) => ({ ...current, achievementReceived: { ...current.achievementReceived, [achievementId]: true } }))}
        clearedFloorIds={game.clearedFloorIds}
      />;
      case "dungeon": return <DungeonScreen floorId={activeFloorId} onNavigate={navigate} playerState={game.playerState}
        setPlayerState={(value) => setGame((current) => ({ ...current, playerState: typeof value === "function" ? value(current.playerState) : value }))}
        inventoryState={game.inventoryState}
        setInventoryState={(value) => setGame((current) => ({ ...current, inventoryState: typeof value === "function" ? value(current.inventoryState) : value }))}
        onInventoryChanged={() => requestSave("itemAcquired")}
        onGoldAwarded={() => requestSave("itemAcquired")}
        onDungeonEntered={() => { setGame((current) => ({ ...current, currentFloorId: activeFloorId })); requestSave("dungeonEntered"); }}
        onDungeonAbandoned={() => setGame((current) => ({ ...current, currentFloorId: null, currentFloorRun: null }))}
        savedFloorRun={game.currentFloorRun}
        onFloorRunChanged={updateFloorRun}
        firstObjectiveEventSeen={Boolean(game.firstObjectiveEventSeen[activeFloorId])}
        onStoryEventSeen={(eventId) => {
          setGame((current) => ({ ...current, firstObjectiveEventSeen: { ...current.firstObjectiveEventSeen, [eventId]: true } }));
          requestSave("itemAcquired");
        }}
        onCollectionRunReset={() => {
          const rule = getItemCollectionQuestRuleForFloor(activeFloorId);
          if (!rule) return;
          setGame((current) => ({
            ...current,
            inventoryState: removeCollectionQuestItems(current.inventoryState, rule),
            firstObjectiveEventSeen: clearCollectionQuestEventFlags(current.firstObjectiveEventSeen, rule),
          }));
          requestSave("itemAcquired");
        }}
        onObjectiveAcquired={(correctCount) => {
          setGame((current) => ({
            ...current,
            currentFloorId: null,
            currentFloorRun: null,
            clearedFloorIds: [...new Set([...current.clearedFloorIds, activeFloorId])],
            firstObjectiveEventSeen: { ...current.firstObjectiveEventSeen, [activeFloorId]: true },
            floorBestCorrect: { ...current.floorBestCorrect, [activeFloorId]: Math.max(current.floorBestCorrect[activeFloorId] ?? 0, correctCount) },
          }));
          requestSave("itemAcquired");
        }}
        onBestCorrect={(correctCount) => setGame((current) => ({ ...current, floorBestCorrect: { ...current.floorBestCorrect, [activeFloorId]: Math.max(current.floorBestCorrect[activeFloorId] ?? 0, correctCount) } }))}
        floorQuestStarted={game.questState[activeFloorQuestId] === "active" || game.questState[activeFloorQuestId] === "completed"}
        floorQuestStatus={game.questState[activeFloorQuestId]}
        onFloor5RewardClaim={(rareUnlocked) => {
          setGame((current) => ({ ...current,
            playerState: { ...current.playerState, gold: current.playerState.gold + 5 },
            inventoryState: rareUnlocked ? changeItemQuantity(current.inventoryState, "armor-munmu", 1) : current.inventoryState,
            questState: completeQuestStateAfterRewardClaim(current.questState, "quest-floor-5-unified-silla"),
            rewardClaimed: { ...current.rewardClaimed, "quest-floor-5-unified-silla": true },
            achievementReceived: rareUnlocked
              ? { ...current.achievementReceived, "achievement-floor-5-rare-reward": true }
              : current.achievementReceived,
          }));
          requestSave("questCompleted");
        }}
        onFloorCleared={() => { setGame((current) => ({ ...current, currentFloorId: null, currentFloorRun: null, clearedFloorIds: [...new Set([...current.clearedFloorIds, activeFloorId])] })); requestSave("floorCleared"); }}
      />;
      case "question": return <QuestionScreen onNavigate={navigate} onResult={(result) => setQuestionResults((current) => [...current, result])} />;
      default: return <TitleScreen onNavigate={navigate} onOpenSettings={() => setSettingsOpen(true)} hasSave={SaveManager.load().success} onDebugFloorJump={(floorId) => {
        const next = createDebugFloorJumpState(floorId, gameRef.current.playerState.name || "DEBUG");
        SaveManager.save(createSaveDataFromGameState(next), "manual");
        setGame(next); gameRef.current = next; startedAtRef.current = Date.now(); setCurrentScreen("baseCamp");
      }} onNewGame={() => {
        if (SaveManager.load().success && !window.confirm("기존 모험 기록이 있습니다.\n새로 시작하면 현재 기록이 초기화됩니다.\n\n새로 시작하시겠습니까?")) return;
        SaveManager.clear(); const next = createInitialGameSaveState(); setGame(next); gameRef.current = next;
        startedAtRef.current = Date.now(); setNamePopupOpen(true);
      }} />;
    }
  })();
  return <>{content}{namePopupOpen && <PlayerNamePopup onCancel={() => setNamePopupOpen(false)} onConfirm={(name) => {
    const nextPlayer = { ...gameRef.current.playerState, name };
    setGame((current) => ({ ...current, playerState: nextPlayer }));
    gameRef.current = { ...gameRef.current, playerState: nextPlayer };
    setNamePopupOpen(false); setCurrentScreen("story"); requestSave("manual", true);
  }} />}{settingsOpen && <SaveManagementPanel currentData={snapshot} onImport={hydrate} onReset={reset} onClose={() => setSettingsOpen(false)} />}{saveMessage && <div className="save-toast" role="status" onClick={() => setSaveMessage("")}>{saveMessage}</div>}</>;
}
