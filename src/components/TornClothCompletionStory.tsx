import { useMemo } from "react";
import { NPC_PORTRAIT_REGISTRY } from "../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../game/npc/npcPresentationResolver";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { NpcId } from "../game/npc/npcTypes";
import type { StoryActor, StorySequence, StoryStep } from "../types/story";

function createActor(npcId: NpcId, portraitId: string): StoryActor {
  const npc = resolveNpcPresentation(npcId);
  return {
    id: npcId,
    name: npc.displayName,
    role: npc.role,
    portraits: {
      [portraitId]: {
        imageUrl:
          NPC_PORTRAIT_REGISTRY[`${npcId}.${portraitId}`] ??
          NPC_PORTRAIT_REGISTRY[`${npcId}.default`],
        placeholder: {
          label: npc.displayName,
          subtitle: npc.role,
          gradient: "linear-gradient(135deg, #30291f, #111)",
        },
      },
    },
  };
}

const show = (id: string, actorId: NpcId, portraitId: string): StoryStep => ({
  id,
  type: "showPortrait",
  actorId,
  portraitId,
  position: "left",
  transition: "fade",
});

const hide = (id: string, actorId: NpcId): StoryStep => ({
  id,
  type: "hidePortrait",
  actorId,
});

const dialogue = (
  id: string,
  speakerId: NpcId,
  speakerName: string,
  text: string,
): StoryStep => ({
  id,
  type: "dialogue",
  speakerId,
  speakerName,
  activeActorId: speakerId,
  text,
  advanceMode: "click",
});

export function TornClothCompletionStory({
  playerName,
  onComplete,
}: {
  playerName: string;
  onComplete: () => void;
}) {
  const sequence = useMemo<StorySequence>(() => ({
    id: "floor-2-torn-cloth-completion",
    title: "던전 2층 조사 완료",
    replayable: false,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {},
    actors: {
      luna: createActor("luna", "happy"),
      theo: createActor("theo", "default"),
    },
    scenes: [{
      id: "floor-2-torn-cloth-completion-scene",
      steps: [
        show("show-luna-1", "luna", "happy"),
        dialogue("luna-line-2", "luna", "루나", "음? 그건..?"),
        dialogue("luna-line-3", "luna", "루나", "옷에 쓰이는 천 조각이잖아! 그런데 이건 좀 이상한걸.."),
        hide("hide-luna-1", "luna"),
        show("show-theo-1", "theo", "default"),
        dialogue("theo-line-1", "theo", "테오", "던전 2층은 분명 고구려, 백제, 신라로 대표되는 삼국시대였죠."),
        dialogue("theo-line-2", "theo", "테오", "그런데 이건... 삼국시대의 천이 아닌 것 같습니다."),
        hide("hide-theo-1", "theo"),
        show("show-luna-2", "luna", "happy"),
        dialogue("luna-line-4", "luna", "루나", "그렇다는 건... 어쩌면 이 시대와 전혀 맞지 않은 사람이 이 던전을 먼저 지나쳐갔다는 뜻이겠네."),
        hide("hide-luna-2", "luna"),
        show("show-theo-2", "theo", "default"),
        dialogue("theo-line-3", "theo", "테오", "확실하지는 않으니 우선 조사를 계속하는 것이 좋아 보입니다."),
        hide("hide-theo-2", "theo"),
        show("show-luna-3", "luna", "happy"),
        dialogue("luna-line-5", "luna", "루나", `알겠어. ${playerName || "플레이어"}, 앞으로도 계속 조사 부탁해!`),
      ],
    }],
  }), [playerName]);

  return (
    <div className="base-camp-story-overlay">
      <StoryPlayer
        sequence={sequence}
        playerName={playerName || "플레이어"}
        onNavigate={() => undefined}
        onComplete={onComplete}
        presentationMode="baseCampOverlay"
      />
    </div>
  );
}
