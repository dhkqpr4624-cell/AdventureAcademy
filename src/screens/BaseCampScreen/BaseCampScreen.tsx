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
import { calculateEquippedDefense, changeItemQuantity, getItemQuantity, type InventoryState } from "../../game/inventory/inventoryState";
import { purchaseShopItem } from "../../game/inventory/shopResolver";
import { QuestRewardPopup } from "../../components/QuestRewardPopup";
import { MemoryCompletionStory } from "../../components/MemoryCompletionStory";
import memoryBeforeUrl from "../../assets/quest/memory-fragments-before.png";
import memoryAfterUrl from "../../assets/quest/memory-fragments-complete.png";
import { Phase21ArmorDebug } from "../../debug/Phase21ArmorDebug";

type BaseCampScreenProps = {
  onNavigate: (screen: ScreenId) => void;
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
};

export function BaseCampScreen({
  onNavigate,
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
  const [shopOpen, setShopOpen] = useState(false);
  const [shopMessage, setShopMessage] = useState("");
  const [memoryCompletionOpen, setMemoryCompletionOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const memoryQuestId = "quest-floor-1-memory-fragment";
  const hasMemoryFragment = getItemQuantity(inventoryState, "quest-memory-fragment") > 0;
  const markerQuestState = hasMemoryFragment && questState[memoryQuestId] === "active"
    ? ({ ...questState, [memoryQuestId]: "readyToComplete" } as unknown as QuestState)
    : questState;
  const activeQuest = QuestManager.getActiveQuest(questState);
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
    const sequenceId = npc.id === "kaiden" && hasMemoryFragment && questState[memoryQuestId] === "active"
      ? "npc-kaiden-quest-complete"
      : resolveNpcStorySequence(npc.id, questState);
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
      setMemoryCompletionOpen(true);
      return;
    }
    const quest = QUEST_DEFINITIONS.find(
      (candidate) => npc.offeredQuestIds.includes(candidate.id),
    );
    if (
      quest &&
      questState[quest.id] === "available" &&
      finishedSequenceId === npc.dialogue.questAvailableStorySequenceId
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
    const result = QuestManager.acceptQuest(questState, questDetail.id);
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
        <button type="button" className="inventory-open-button" disabled={interactionLocked} onClick={() => setInventoryOpen(true)}>
          <img src={`${import.meta.env.BASE_URL}assets/ui/inventory.png`} alt="" aria-hidden="true" draggable={false} />
          <span className="visually-hidden">인벤토리</span>
        </button>
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
                  onClick={() => unlocked && onNavigate("dungeon")}
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
          setInventoryState((current) => {
            const next = {
              ...current,
              equippedItemIds: {
                ...current.equippedItemIds,
                [slot]: itemId,
              },
            };
            setPlayerState((player) => ({
              ...player,
              defense: calculateEquippedDefense(next),
            }));
            return next;
          });
          onAutoSave("equipmentChanged");
        }}
      />}
      {shopOpen && <ShopPopup inventory={inventoryState} gold={playerState.gold} message={shopMessage} onBuy={buyItem} onClose={() => {
        setShopOpen(false);
        setFocusPointId("campCenter");
        void viewportRef.current?.restore(450);
      }} />}
      {memoryCompletionOpen && <MemoryCompletionStory beforeUrl={memoryBeforeUrl} afterUrl={memoryAfterUrl} onComplete={() => {
        setMemoryCompletionOpen(false);
        setRewardOpen(true);
      }} />}
      {rewardOpen && <QuestRewardPopup
        bestCorrect={floorBestCorrect["floor-1"] ?? 0}
        claimed={Boolean(rewardClaimed[memoryQuestId])}
        onCancel={() => setRewardOpen(false)}
        onClaim={() => {
          if (rewardClaimed[memoryQuestId]) return;
          const rareUnlocked = (floorBestCorrect["floor-1"] ?? 0) >= 6;
          setPlayerState((current) => ({ ...current, gold: current.gold + 5 }));
          setInventoryState((current) => {
            let next = changeItemQuantity(current, "quest-memory-fragment", -1);
            if (rareUnlocked) next = changeItemQuantity(next, "weapon-gojoseon-bronze-dagger", 1);
            return next;
          });
          setQuestState((current) => ({ ...current, [memoryQuestId]: "completed" }));
          setRewardClaimed(memoryQuestId);
          onAutoSave("questCompleted");
          setRewardOpen(false);
        }}
      />}
    </main>
  );
}
