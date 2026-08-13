import {
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ScreenId } from "../../app/routes";
import { PlayerStatusBar } from "../../components/PlayerStatusBar";
import { BASE_CAMP_MAP } from "../../data/baseCampMap";
import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";
import type { NpcDefinition } from "../../game/npc/npcTypes";
import { resolveNpcStorySequence } from "../../game/npc/npcStoryResolver";
import type { PlayerState } from "../../game/player/playerState";
import { QUEST_DEFINITIONS } from "../../game/quest/questDefinitions";
import { QuestManager } from "../../game/quest/QuestManager";
import type { QuestDefinition, QuestState } from "../../game/quest/questTypes";
import { StoryPlayer } from "../../game/story/StoryPlayer";
import type { BaseCampInteractionRegion } from "../../types/baseCamp";
import { FLOOR_DEFINITIONS } from "../../game/floor/floorDefinitions";
import { FloorUnlockManager } from "../../game/floor/FloorUnlockManager";
import { resolveQuestFloorUnlock } from "../../game/floor/FloorUnlockResolver";
import type { FloorUnlockState } from "../../game/floor/floorTypes";
import type { StoryActionState } from "../../game/story/storyActionTypes";
import type { SaveReason } from "../../save/saveTypes";
import {
  BaseCampViewport,
  type BaseCampViewportController,
} from "./BaseCampViewport";
import { InventoryPopup } from "../../components/InventoryPopup";
import { ShopPopup } from "../../components/ShopPopup";
import { changeItemQuantity, getItemQuantity, recalculatePlayerMaxHp, type InventoryState } from "../../game/inventory/inventoryState";
import { purchaseShopItem } from "../../game/inventory/shopResolver";
import { QuestRewardPopup } from "../../components/QuestRewardPopup";
import { MemoryCompletionStory } from "../../components/MemoryCompletionStory";
import { TornClothCompletionStory } from "../../components/TornClothCompletionStory";
import { PrehistoryCompletionStory } from "../../components/PrehistoryCompletionStory";
import memoryBeforeUrl from "../../assets/quest/memory-fragments-before.png";
import memoryAfterUrl from "../../assets/quest/memory-fragments-complete.png";
import { Phase21ArmorDebug } from "../../debug/Phase21ArmorDebug";
import { getQuestRareRewardCondition } from "../../game/quest/questRareRewardConditions";
import { AchievementPopup } from "../../components/AchievementPopup";
import { ACHIEVEMENT_DEFINITIONS } from "../../data/achievementDefinitions";
import {
  ITEM_COLLECTION_QUEST_RULES,
  canCompleteItemCollectionQuest,
} from "../../game/quest/itemCollectionQuestRules";
import {
  completeQuestStateAfterRewardClaim,
  removeQuestItemsAfterRewardClaim,
  resolveQuestRewardGrant,
} from "../../game/quest/questRewardCompletionResolver";

const memoryQuestRareRewardCondition = getQuestRareRewardCondition(
  "quest-floor-2-memory-fragment",
);
const tornClothQuestRareRewardCondition = getQuestRareRewardCondition(
  "quest-floor-3-torn-cloth",
);
const prehistoryQuestRareRewardCondition = getQuestRareRewardCondition("quest-floor-1-prehistory");
const jeonQuestRareRewardCondition = getQuestRareRewardCondition("quest-floor-4-jeon-rescue");

type BaseCampScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  onEnterDungeon: (floorId: "floor-1" | "floor-2" | "floor-3" | "floor-4") => void;
  playerState: PlayerState;
  setPlayerState: Dispatch<SetStateAction<PlayerState>>;
  inventoryState: InventoryState;
  setInventoryState: Dispatch<SetStateAction<InventoryState>>;
  questState: QuestState;
  setQuestState: Dispatch<SetStateAction<QuestState>>;
  floorUnlockState: FloorUnlockState;
  setFloorUnlockState: Dispatch<SetStateAction<FloorUnlockState>>;
  storyActionState: StoryActionState;
  setStoryActionState: Dispatch<SetStateAction<StoryActionState>>;
  onAutoSave: (reason: SaveReason) => void;
  onStoryCompleted: (storyId: string) => void;
  onStoryCheckpoint: (storyId: string, checkpointId: string) => void;
  floorBestCorrect: Record<string, number>;
  rewardClaimed: Record<string, boolean>;
  setRewardClaimed: (questId: string) => void;
  rewardRevealed: Record<string, boolean>;
  setRewardRevealed: (questId: string) => void;
  achievementReceived: Record<string, boolean>;
  setAchievementReceived: (achievementId: string) => void;
  clearedFloorIds: readonly string[];
};

export function BaseCampScreen({
  onNavigate,
  onEnterDungeon,
  playerState,
  setPlayerState,
  inventoryState,
  setInventoryState,
  questState,
  setQuestState,
  floorUnlockState,
  setFloorUnlockState,
  storyActionState,
  setStoryActionState,
  onAutoSave,
  onStoryCompleted,
  onStoryCheckpoint,
  floorBestCorrect,
  rewardClaimed,
  setRewardClaimed,
  rewardRevealed,
  setRewardRevealed,
  achievementReceived,
  setAchievementReceived,
  clearedFloorIds,
}: BaseCampScreenProps) {
  const viewportRef = useRef<BaseCampViewportController>(null);
  const interactionLockRef = useRef(false);
  const questAcceptProcessingRef = useRef(false);
  const dialogueCompletedRef = useRef(false);
  const [focusPointId, setFocusPointId] = useState("campCenter");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<NpcDefinition | null>(null);
  const [storySequenceId, setStorySequenceId] = useState<string | null>(null);
  const [questDetail, setQuestDetail] = useState<QuestDefinition | null>(null);
  const [floorListOpen, setFloorListOpen] = useState(false);
  const [cameraTransitioning, setCameraTransitioning] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopMessage, setShopMessage] = useState("");
  const [memoryCompletionOpen, setMemoryCompletionOpen] = useState(false);
  const [prehistoryCompletionOpen, setPrehistoryCompletionOpen] = useState(false);
  const [tornClothCompletionOpen, setTornClothCompletionOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [prehistoryRewardOpen, setPrehistoryRewardOpen] = useState(false);
  const [tornClothRewardOpen, setTornClothRewardOpen] = useState(false);
  const [jeonRewardOpen, setJeonRewardOpen] = useState(false);
  const prehistoryQuestId = "quest-floor-1-prehistory";
  const memoryQuestId = "quest-floor-2-memory-fragment";
  const tornClothQuestId = "quest-floor-3-torn-cloth";
  const jeonQuestId = "quest-floor-4-jeon-rescue";
  const effectiveQuestState: QuestState = {
    ...questState,
    ...(questState[prehistoryQuestId] === "completed" && questState[memoryQuestId] === "locked" ? { [memoryQuestId]: "available" as const } : {}),
    ...(questState[memoryQuestId] === "completed" && questState[tornClothQuestId] === "locked" ? { [tornClothQuestId]: "available" as const } : {}),
    ...(questState[tornClothQuestId] === "completed" && questState[jeonQuestId] === "locked" ? { [jeonQuestId]: "available" as const } : {}),
  };
  const prehistoryCollectionRule = ITEM_COLLECTION_QUEST_RULES[0];
  const canCompletePrehistoryQuest = canCompleteItemCollectionQuest(
    inventoryState,
    clearedFloorIds,
    prehistoryCollectionRule,
  );
  const hasMemoryFragment = getItemQuantity(inventoryState, "quest-memory-fragment") > 0;
  const hasTornCloth = getItemQuantity(inventoryState, "quest-torn-cloth") > 0;
  const hasFoundJeon = clearedFloorIds.includes("floor-4");
  const markerQuestState = {
    ...effectiveQuestState,
    ...(canCompletePrehistoryQuest && effectiveQuestState[prehistoryQuestId] === "active" ? { [prehistoryQuestId]: "readyToComplete" as const } : {}),
    ...(hasMemoryFragment && effectiveQuestState[memoryQuestId] === "active"
      ? { [memoryQuestId]: "readyToComplete" as const }
      : {}),
    ...(hasTornCloth && effectiveQuestState[tornClothQuestId] === "active"
      ? { [tornClothQuestId]: "readyToComplete" as const }
      : {}),
    ...(hasFoundJeon && effectiveQuestState[jeonQuestId] === "active"
      ? { [jeonQuestId]: "readyToComplete" as const }
      : {}),
  } as unknown as QuestState;
  const activeQuest = QuestManager.getActiveQuest(effectiveQuestState);
  const interactionLocked = Boolean(
    storySequenceId || questDetail || floorListOpen || inventoryOpen || shopOpen || cameraTransitioning,
  );

  const buyItem = (itemId: string) => {
    const result = purchaseShopItem(inventoryState, playerState.gold, itemId);
    if (!result.success) {
      setShopMessage(result.reason === "maxQuantity" ? "이미 최대 개수만큼 보유하고 있습니다." : "Gold가 부족합니다.");
      return;
    }
    setInventoryState(result.inventory);
    setPlayerState((current) => ({ ...current, gold: result.gold }));
    setShopMessage("구매했습니다.");
    onAutoSave("shopUsed");
  };

  const focusDungeonEntranceAndOpen = async (
    region: BaseCampInteractionRegion,
  ) => {
    if (
      interactionLockRef.current ||
      interactionLocked ||
      floorListOpen ||
      region.id !== "dungeonEntrance"
    ) {
      return;
    }
    interactionLockRef.current = true;
    setCameraTransitioning(true);
    setSelectedRegionId(region.id);
    setFocusPointId(region.id);
    await viewportRef.current?.focus(region.id, 350);
    setFloorListOpen(true);
    setCameraTransitioning(false);
    interactionLockRef.current = false;
  };

  const handleSelectRegion = (region: BaseCampInteractionRegion) => {
    if (interactionLockRef.current || interactionLocked) return;
    if (region.id === "dungeonEntrance") {
      void focusDungeonEntranceAndOpen(region);
      return;
    }
    setSelectedRegionId(region.id);
    setFocusPointId(region.id);
  };

  const handleSelectNpc = async (npc: NpcDefinition) => {
    if (interactionLockRef.current || interactionLocked) return;
    interactionLockRef.current = true;
    setSelectedNpc(npc);
    dialogueCompletedRef.current = false;
    setSelectedRegionId(null);
    await viewportRef.current?.focus(npc.baseCampSpawnId, 550);
    if (npc.id === "kaiden" && canCompletePrehistoryQuest && effectiveQuestState[prehistoryQuestId] === "active") {
      setPrehistoryCompletionOpen(true);
      interactionLockRef.current = false;
      return;
    }
    const sequenceId =
      npc.id === "kaiden" && hasMemoryFragment && effectiveQuestState[memoryQuestId] === "active"
          ? "npc-kaiden-floor-2-quest-complete"
        : npc.id === "luna" &&
            hasTornCloth &&
            effectiveQuestState[tornClothQuestId] === "active"
          ? "npc-luna-floor-3-quest-complete"
        : npc.id === "luna" &&
            hasFoundJeon &&
            effectiveQuestState[jeonQuestId] === "active"
          ? "npc-luna-floor-4-quest-complete"
          : resolveNpcStorySequence(npc.id, effectiveQuestState);
    setStorySequenceId(sequenceId);
    interactionLockRef.current = false;
  };

  const finishNpcStory = async () => {
    if (dialogueCompletedRef.current) return;
    dialogueCompletedRef.current = true;
    const npc = selectedNpc;
    const finishedSequenceId = storySequenceId;
    setStorySequenceId(null);
    onAutoSave("npcDialogueCompleted");
    if (!npc) return;
    if (finishedSequenceId === "npc-kaiden-quest-complete") {
      setPrehistoryCompletionOpen(true);
      return;
    }
    if (finishedSequenceId === "npc-kaiden-floor-2-quest-complete") {
      setMemoryCompletionOpen(true);
      return;
    }
    if (finishedSequenceId === "npc-luna-floor-3-quest-complete") {
      setTornClothCompletionOpen(true);
      return;
    }
    if (finishedSequenceId === "npc-luna-floor-4-quest-complete") {
      revealReward(jeonQuestId);
      setJeonRewardOpen(true);
      return;
    }
    const quest = QUEST_DEFINITIONS.find((candidate) =>
      npc.offeredQuestIds.includes(candidate.id) && effectiveQuestState[candidate.id] === "available"
    );
    if (
      quest &&
      effectiveQuestState[quest.id] === "available" &&
      finishedSequenceId === quest.offerStorySequenceId
    ) {
      setQuestDetail(quest);
    } else {
      interactionLockRef.current = true;
      setCameraTransitioning(true);
      setSelectedNpc(null);
      setFocusPointId("campCenter");
      await viewportRef.current?.restore(450);
      setCameraTransitioning(false);
      interactionLockRef.current = false;
    }
  };

  const acceptQuest = () => {
    if (!questDetail || questAcceptProcessingRef.current) return;
    questAcceptProcessingRef.current = true;
    const result = QuestManager.acceptQuest(effectiveQuestState, questDetail.id);
    if (result.success) {
      setQuestState(result.nextState);
      const progression = resolveQuestFloorUnlock({
        questId: questDetail.id,
        floorState: floorUnlockState,
        actionState: storyActionState,
        save: () => undefined,
      });
      setFloorUnlockState(progression.nextFloorState);
      setStoryActionState(progression.nextActionState);
      onAutoSave("questAccepted");
      setQuestDetail(null);
      dialogueCompletedRef.current = false;
      setStorySequenceId(questDetail.acceptStorySequenceId ?? null);
    }
    questAcceptProcessingRef.current = false;
  };

  const openFloorList = () => {
    const entrance = BASE_CAMP_MAP.interactionRegions.find(
      (region) => region.id === "dungeonEntrance",
    );
    if (entrance) void focusDungeonEntranceAndOpen(entrance);
  };

  const closeFloorList = () => {
    setFloorListOpen(false);
    setSelectedRegionId(null);
    setFocusPointId("campCenter");
    void viewportRef.current?.restore(450);
  };

  const closeQuestDetail = () => {
    setQuestDetail(null);
    setSelectedNpc(null);
    setFocusPointId("campCenter");
    void viewportRef.current?.restore(450);
  };

  const revealReward = (questId: string) => {
    setRewardRevealed(questId);
    onAutoSave("npcDialogueCompleted");
  };

  const completeQuestAfterRewardClaim = (questId: string) => {
    setQuestState((current) => completeQuestStateAfterRewardClaim(current, questId));
    onAutoSave("questCompleted");
  };

  return (
    <main className="game-screen base-camp-screen">
      <BaseCampViewport
        ref={viewportRef}
        map={BASE_CAMP_MAP}
        mode={interactionLocked ? "story" : "play"}
        focusPointId={focusPointId}
        selectedRegionId={selectedRegionId}
        onSelectRegion={handleSelectRegion}
        selectedNpcId={selectedNpc?.id}
        onSelectNpc={(npc) => void handleSelectNpc(npc)}
        highlightTargetId={
          selectedRegionId === "dungeonEntrance" ? null : selectedRegionId
        }
        interactionsDisabled={interactionLocked}
        questState={markerQuestState}
        visibleNpcIds={rewardClaimed["quest-floor-4-jeon-rescue"]
          ? ["luna", "theo", "kaiden", "jeon"]
          : ["luna", "theo", "kaiden"]}
      />

      <aside className="current-quest-tracker" aria-live="polite">
        <p className="eyebrow">현재 퀘스트</p>
        {activeQuest ? (
          <>
            <strong>{activeQuest.title}</strong>
            <span>{activeQuest.summary}</span>
            <small>진행 중</small>
          </>
        ) : (
          <span>현재 퀘스트 없음</span>
        )}
      </aside>

      {!storySequenceId && (
        <div className="utility-button-row">
          <button type="button" className="inventory-open-button" disabled={interactionLocked} onClick={() => setInventoryOpen(true)}>
            <img src={`${import.meta.env.BASE_URL}assets/ui/inventory.png`} alt="" aria-hidden="true" draggable={false} />
            <span className="visually-hidden">인벤토리</span>
          </button>
          <button type="button" className="achievement-open-button" disabled={interactionLocked} onClick={() => setAchievementOpen(true)}>
            <img src={`${import.meta.env.BASE_URL}assets/ui/achievement.png`} alt="" aria-hidden="true" draggable={false} />
            <span className="visually-hidden">업적</span>
          </button>
        </div>
      )}

      <nav className="base-camp-main-controls" aria-label="베이스캠프 이동">
        <button
          type="button"
          disabled={interactionLocked}
          onClick={openFloorList}
        >
          던전
        </button>
        <button
          type="button"
          disabled={interactionLocked}
          onClick={() => onNavigate("title")}
        >
          타이틀
        </button>
      </nav>

      <Phase21ArmorDebug
        inventory={inventoryState}
        onGrant={(nextInventory) => {
          setInventoryState(nextInventory);
          onAutoSave("itemAcquired");
        }}
      />

      {storySequenceId && NPC_STORY_SEQUENCES[storySequenceId] && (
        <div className="base-camp-story-overlay">
          <StoryPlayer
            key={storySequenceId}
            sequence={JSON.parse(JSON.stringify(NPC_STORY_SEQUENCES[storySequenceId]).replaceAll("{{playerName}}", playerState.name || "플레이어"))}
            playerName={playerState.name || "플레이어"}
            onNavigate={onNavigate}
            onComplete={finishNpcStory}
            onStoryStarted={() => onAutoSave("storyStarted")}
            onStoryCompleted={onStoryCompleted}
            onCheckpointReached={onStoryCheckpoint}
            presentationMode="baseCampOverlay"
            onChoiceAction={(actionId) => {
              if (actionId === "open-theo-shop") {
                setStorySequenceId(null);
                setSelectedNpc(null);
                setShopMessage("");
                setShopOpen(true);
              }
            }}
          />
        </div>
      )}

      {questDetail && (
        <section className="quest-detail-panel" aria-labelledby="quest-title">
          <div className="quest-detail-body">
            <p className="eyebrow">QUEST</p>
            <h2 id="quest-title">{questDetail.title}</h2>
            <p>{questDetail.description}</p>
            <dl>
              <div>
                <dt>목표</dt>
                <dd>{questDetail.objectiveText}</dd>
              </div>
              <div>
                <dt>보상</dt>
                <dd>{questDetail.rewards.description}</dd>
              </div>
            </dl>
          </div>
          <div className="quest-detail-actions">
            <button type="button" onClick={acceptQuest}>퀘스트 수락</button>
            <button type="button" onClick={closeQuestDetail}>나중에</button>
          </div>
          <footer>
            <PlayerStatusBar {...playerState} />
          </footer>
        </section>
      )}

      {floorListOpen && (
        <section className="floor-list-panel" aria-labelledby="floor-list-title">
          <p className="eyebrow">DUNGEON</p>
          <h2 id="floor-list-title">층 선택</h2>
          <div className="floor-list">
            {FLOOR_DEFINITIONS.map((floor) => {
              const unlocked = FloorUnlockManager.isUnlocked(
                floorUnlockState,
                floor.id,
              );
              return (
                <button
                  key={floor.id}
                  type="button"
                  className={unlocked ? "is-unlocked" : "is-locked"}
                  disabled={!unlocked}
                  onClick={() => unlocked && onEnterDungeon(floor.id)}
                >
                  <strong>{unlocked ? floor.title : "???"}</strong>
                  <small>
                    {unlocked
                      ? "입장 가능"
                      : "새로운 의뢰를 받아야 입장할 수 있습니다."}
                  </small>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={closeFloorList}>닫기</button>
        </section>
      )}
      {inventoryOpen && <InventoryPopup
        inventory={inventoryState}
        gold={playerState.gold}
        onClose={() => setInventoryOpen(false)}
        onEquipmentChange={(slot, itemId) => {
          const previousInventory = inventoryState;
          const nextInventory = {
            ...previousInventory,
            equippedItemIds: {
              ...previousInventory.equippedItemIds,
              [slot]: itemId,
            },
          };
          setInventoryState(nextInventory);
          setPlayerState((player) =>
            recalculatePlayerMaxHp(
              player,
              previousInventory,
              nextInventory,
            ),
          );
          onAutoSave("equipmentChanged");
        }}
      />}
      {achievementOpen && <AchievementPopup
        floorBestCorrect={floorBestCorrect}
        achievementReceived={achievementReceived}
        rewardRevealed={rewardRevealed}
        onClose={() => setAchievementOpen(false)}
        onClaim={(achievementId) => {
          const achievement = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === achievementId);
          if (!achievement || achievementReceived[achievement.id]) return;
          if (effectiveQuestState[achievement.rewardStateId] !== "completed") return;
          if ((floorBestCorrect[achievement.floorId] ?? 0) < achievement.requiredCorrect) return;
          setInventoryState((current) => changeItemQuantity(current, achievement.rewardItemId, 1));
          setAchievementReceived(achievement.id);
          onAutoSave("itemAcquired");
        }}
      />}
      {shopOpen && <ShopPopup inventory={inventoryState} gold={playerState.gold} message={shopMessage} onBuy={buyItem} onClose={() => {
        setShopOpen(false);
        setFocusPointId("campCenter");
        void viewportRef.current?.restore(450);
      }} />}
      {memoryCompletionOpen && <MemoryCompletionStory beforeUrl={memoryBeforeUrl} afterUrl={memoryAfterUrl} onComplete={() => {
        setMemoryCompletionOpen(false);
        revealReward(memoryQuestId);
        setRewardOpen(true);
      }} />}
      {prehistoryCompletionOpen && <PrehistoryCompletionStory playerName={playerState.name || "플레이어"} onComplete={() => {
        setPrehistoryCompletionOpen(false);
        revealReward(prehistoryQuestId);
        setPrehistoryRewardOpen(true);
      }} />}
      {tornClothCompletionOpen && <TornClothCompletionStory
        playerName={playerState.name || "플레이어"}
        onComplete={() => {
          setTornClothCompletionOpen(false);
          revealReward(tornClothQuestId);
          setTornClothRewardOpen(true);
        }}
      />}
      {rewardOpen && <QuestRewardPopup
        bestCorrect={floorBestCorrect["floor-2"] ?? 0}
        claimed={Boolean(rewardClaimed[memoryQuestId])}
        requiredCorrect={memoryQuestRareRewardCondition.requiredCorrect}
        onCancel={() => setRewardOpen(false)}
        onClaim={() => {
          if (rewardClaimed[memoryQuestId]) return;
          const reward = resolveQuestRewardGrant(floorBestCorrect["floor-2"] ?? 0, memoryQuestRareRewardCondition.requiredCorrect);
          const rareUnlocked = reward.rareUnlocked;
          setPlayerState((current) => ({ ...current, gold: current.gold + reward.gold }));
          setInventoryState((current) => {
            let next = removeQuestItemsAfterRewardClaim(current, memoryQuestId);
            if (rareUnlocked) next = changeItemQuantity(next, "weapon-gojoseon-bronze-dagger", 1);
            return next;
          });
          setRewardClaimed(memoryQuestId);
          completeQuestAfterRewardClaim(memoryQuestId);
          if (rareUnlocked) {
            setAchievementReceived("achievement-floor-2-rare-reward");
          }
          onAutoSave("questCompleted");
          setRewardOpen(false);
        }}
      />}
      {tornClothRewardOpen && <QuestRewardPopup
        bestCorrect={floorBestCorrect["floor-3"] ?? 0}
        claimed={Boolean(rewardClaimed[tornClothQuestId])}
        questTitle="던전 3층 조사 완료"
        rareRewardItemId="armor-gwanggaeto"
        requiredCorrect={tornClothQuestRareRewardCondition.requiredCorrect}
        onCancel={() => setTornClothRewardOpen(false)}
        onClaim={() => {
          if (rewardClaimed[tornClothQuestId]) return;
          const reward = resolveQuestRewardGrant(floorBestCorrect["floor-3"] ?? 0, tornClothQuestRareRewardCondition.requiredCorrect);
          const rareUnlocked = reward.rareUnlocked;
          setPlayerState((current) => ({ ...current, gold: current.gold + reward.gold }));
          setInventoryState((current) => {
            let next = removeQuestItemsAfterRewardClaim(current, tornClothQuestId);
            if (rareUnlocked) next = changeItemQuantity(next, "armor-gwanggaeto", 1);
            return next;
          });
          setRewardClaimed(tornClothQuestId);
          completeQuestAfterRewardClaim(tornClothQuestId);
          if (rareUnlocked) {
            setAchievementReceived("achievement-floor-3-rare-reward");
          }
          onAutoSave("questCompleted");
          setTornClothRewardOpen(false);
        }}
      />}
      {prehistoryRewardOpen && <QuestRewardPopup
        bestCorrect={floorBestCorrect["floor-1"] ?? 0}
        claimed={Boolean(rewardClaimed[prehistoryQuestId])}
        questTitle="던전 1층 조사 완료"
        rareRewardItemId="weapon-hand-axe"
        requiredCorrect={prehistoryQuestRareRewardCondition.requiredCorrect}
        onCancel={() => setPrehistoryRewardOpen(false)}
        onClaim={() => {
          if (rewardClaimed[prehistoryQuestId]) return;
          const reward = resolveQuestRewardGrant(floorBestCorrect["floor-1"] ?? 0, prehistoryQuestRareRewardCondition.requiredCorrect);
          const rareUnlocked = reward.rareUnlocked;
          setPlayerState((current) => ({ ...current, gold: current.gold + reward.gold }));
          setInventoryState((current) => {
            let next = removeQuestItemsAfterRewardClaim(current, prehistoryQuestId);
            if (rareUnlocked) next = changeItemQuantity(next, "weapon-hand-axe", 1);
            return next;
          });
          setRewardClaimed(prehistoryQuestId);
          completeQuestAfterRewardClaim(prehistoryQuestId);
          if (rareUnlocked) setAchievementReceived("achievement-floor-1-rare-reward");
          onAutoSave("questCompleted");
          setPrehistoryRewardOpen(false);
        }}
      />}
      {jeonRewardOpen && <QuestRewardPopup
        bestCorrect={floorBestCorrect["floor-4"] ?? 0}
        claimed={Boolean(rewardClaimed[jeonQuestId])}
        questTitle="던전 4층 조사 완료"
        rareRewardItemId="weapon-chiljido"
        requiredCorrect={jeonQuestRareRewardCondition.requiredCorrect}
        onCancel={() => setJeonRewardOpen(false)}
        onClaim={() => {
          if (rewardClaimed[jeonQuestId]) return;
          const reward = resolveQuestRewardGrant(floorBestCorrect["floor-4"] ?? 0, jeonQuestRareRewardCondition.requiredCorrect);
          const rareUnlocked = reward.rareUnlocked;
          setPlayerState((current) => ({ ...current, gold: current.gold + reward.gold }));
          setInventoryState((current) => {
            let next = removeQuestItemsAfterRewardClaim(current, jeonQuestId);
            if (rareUnlocked) next = changeItemQuantity(next, "weapon-chiljido", 1);
            return next;
          });
          if (rareUnlocked) {
            setAchievementReceived("achievement-floor-4-rare-reward");
          }
          setRewardClaimed(jeonQuestId);
          completeQuestAfterRewardClaim(jeonQuestId);
          onAutoSave("questCompleted");
          setJeonRewardOpen(false);
        }}
      />}
    </main>
  );
}
