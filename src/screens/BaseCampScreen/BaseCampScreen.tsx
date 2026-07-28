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
import {
  BaseCampViewport,
  type BaseCampViewportController,
} from "./BaseCampViewport";

type BaseCampScreenProps = {
  onNavigate: (screen: ScreenId) => void;
  playerState: PlayerState;
  questState: QuestState;
  setQuestState: Dispatch<SetStateAction<QuestState>>;
};

export function BaseCampScreen({
  onNavigate,
  playerState,
  questState,
  setQuestState,
}: BaseCampScreenProps) {
  const viewportRef = useRef<BaseCampViewportController>(null);
  const interactionLockRef = useRef(false);
  const questAcceptProcessingRef = useRef(false);
  const [focusPointId, setFocusPointId] = useState("campCenter");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<NpcDefinition | null>(null);
  const [storySequenceId, setStorySequenceId] = useState<string | null>(null);
  const [questDetail, setQuestDetail] = useState<QuestDefinition | null>(null);
  const activeQuest = QuestManager.getActiveQuest(questState);
  const interactionLocked = Boolean(storySequenceId || questDetail);

  const handleSelectRegion = (region: BaseCampInteractionRegion) => {
    if (interactionLockRef.current || interactionLocked) return;
    setSelectedRegionId(region.id);
    setFocusPointId(region.id);
  };

  const handleSelectNpc = async (npc: NpcDefinition) => {
    if (interactionLockRef.current || interactionLocked) return;
    interactionLockRef.current = true;
    setSelectedNpc(npc);
    setSelectedRegionId(null);
    setFocusPointId(npc.baseCampSpawnId);
    await viewportRef.current?.focus(npc.baseCampSpawnId, 550);
    const sequenceId = resolveNpcStorySequence(npc.id, questState);
    setStorySequenceId(sequenceId);
    interactionLockRef.current = false;
  };

  const finishNpcStory = () => {
    const npc = selectedNpc;
    const finishedSequenceId = storySequenceId;
    setStorySequenceId(null);
    if (!npc) return;
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
      setSelectedNpc(null);
      setFocusPointId("campCenter");
      void viewportRef.current?.restore(450);
    }
  };

  const acceptQuest = () => {
    if (!questDetail || questAcceptProcessingRef.current) return;
    questAcceptProcessingRef.current = true;
    const result = QuestManager.acceptQuest(questState, questDetail.id);
    if (result.success) {
      setQuestState(result.nextState);
      setQuestDetail(null);
      setStorySequenceId(questDetail.acceptStorySequenceId ?? null);
    }
    questAcceptProcessingRef.current = false;
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
        highlightTargetId={selectedRegionId}
        interactionsDisabled={interactionLocked}
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

      <nav className="base-camp-main-controls" aria-label="베이스캠프 이동">
        <button
          type="button"
          disabled={interactionLocked}
          onClick={() => onNavigate("dungeon")}
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

      {storySequenceId && NPC_STORY_SEQUENCES[storySequenceId] && (
        <div className="base-camp-story-overlay">
          <StoryPlayer
            key={storySequenceId}
            sequence={NPC_STORY_SEQUENCES[storySequenceId]}
            onNavigate={onNavigate}
            onComplete={finishNpcStory}
            presentationMode="baseCampOverlay"
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
    </main>
  );
}
