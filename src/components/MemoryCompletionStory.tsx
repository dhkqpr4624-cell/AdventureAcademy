import { NPC_PORTRAIT_REGISTRY } from "../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../game/npc/npcPresentationResolver";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { NpcId } from "../game/npc/npcTypes";
import type { StoryActor, StorySequence, StoryStep } from "../types/story";

function actor(npcId: NpcId, portraitId: string): StoryActor {
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

function dialogue(
  id: string,
  npcId: NpcId,
  text: string,
): StoryStep {
  const npc = resolveNpcPresentation(npcId);
  return {
    id,
    type: "dialogue",
    speakerId: npcId,
    speakerName: npc.displayName,
    activeActorId: npcId,
    text,
    advanceMode: "click",
  };
}

function createMemoryCompletionSequence(beforeUrl: string, afterUrl: string): StorySequence {
  return {
    id: "floor-1-memory-completion",
    title: "고조선의 기억 완성",
    replayable: false,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {
      before: {
        imageUrl: beforeUrl,
        placeholder: {
          label: "서로 연결되기 전의 두 기억 조각",
          gradient: "linear-gradient(#050505, #000000)",
        },
      },
      complete: {
        imageUrl: afterUrl,
        placeholder: {
          label: "완성된 고조선 건국 비석",
          gradient: "linear-gradient(#050505, #000000)",
        },
      },
    },
    actors: {
      kaiden: actor("kaiden", "serious"),
      theo: actor("theo", "default"),
      luna: actor("luna", "happy"),
    },
    scenes: [{
      id: "floor-1-memory-completion-scene",
      steps: [
        { id: "memory-before", type: "setBackground", backgroundId: "before", transition: "fade", durationMs: 700 },
        { id: "memory-before-wait", type: "wait", durationMs: 3000, advanceMode: "auto" },
        { id: "memory-complete", type: "setBackground", backgroundId: "complete", transition: "fade", durationMs: 700 },
        { id: "show-kaiden", type: "showPortrait", actorId: "kaiden", portraitId: "serious", position: "left", transition: "fade" },
        dialogue("memory-line-1", "kaiden", "이건.."),
        { id: "hide-kaiden-1", type: "hidePortrait", actorId: "kaiden" },
        { id: "show-theo", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
        dialogue("memory-line-2", "theo", "웅녀와 환웅의 아들\n단군왕검이\n고조선이라는 나라를 세우다."),
        dialogue("memory-line-3", "theo", "저희가 찾은 것은\n우리나라 역사의 시작을\n보여주는 비석이었나 보군요."),
        dialogue("memory-line-4", "theo", "...!"),
        { id: "hide-theo", type: "hidePortrait", actorId: "theo" },
        { id: "show-luna", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
        dialogue("memory-line-5", "luna", "대장!\n던전 2층으로 가는 문이 열린 것 같아."),
        { id: "hide-luna", type: "hidePortrait", actorId: "luna" },
        { id: "show-kaiden-2", type: "showPortrait", actorId: "kaiden", portraitId: "serious", position: "left", transition: "fade" },
        dialogue("memory-line-6", "kaiden", "그래.\n이제 다음 계획을 세워야겠군."),
      ],
    }],
  };
}

export function MemoryCompletionStory({ beforeUrl, afterUrl, onComplete }: {
  beforeUrl: string; afterUrl: string; onComplete: () => void;
}) {
  return (
    <div className="quest-story-overlay">
      <StoryPlayer
        sequence={createMemoryCompletionSequence(beforeUrl, afterUrl)}
        onNavigate={() => undefined}
        onComplete={onComplete}
      />
    </div>
  );
}
