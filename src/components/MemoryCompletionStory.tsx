import { useEffect, useMemo, useState } from "react";
import { NPC_PORTRAIT_REGISTRY } from "../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../game/npc/npcPresentationResolver";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { NpcId } from "../game/npc/npcTypes";
import type { StoryActor, StorySequence, StoryStep } from "../types/story";

type CompletionPhase =
  | "before"
  | "fade"
  | "firstDialogue"
  | "shake"
  | "secondDialogue";

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

function createDialogueSequence(
  id: string,
  steps: StoryStep[],
): StorySequence {
  return {
    id,
    title: "고조선의 기억 완성",
    replayable: false,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {},
    actors: {
      kaiden: createActor("kaiden", "serious"),
      theo: createActor("theo", "default"),
      luna: createActor("luna", "happy"),
    },
    scenes: [{ id: `${id}-scene`, steps }],
  };
}

export function MemoryCompletionStory({
  beforeUrl,
  afterUrl,
  onComplete,
}: {
  beforeUrl: string;
  afterUrl: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<CompletionPhase>("before");

  const firstSequence = useMemo(
    () =>
      createDialogueSequence("floor-1-memory-completion-first", [
        { id: "show-kaiden", type: "showPortrait", actorId: "kaiden", portraitId: "serious", position: "left", transition: "fade" },
        { id: "kaiden-line", type: "dialogue", speakerId: "kaiden", speakerName: "카이든", activeActorId: "kaiden", text: "이건..", advanceMode: "click" },
        { id: "hide-kaiden", type: "hidePortrait", actorId: "kaiden" },
        { id: "show-theo", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
        { id: "theo-reading", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "웅녀와 환웅의 아들\n단군왕검이\n고조선이라는 나라를 세우다.", advanceMode: "click" },
        { id: "theo-explanation", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "저희가 찾은 것은\n우리나라 역사의 시작을\n보여주는 비석이었나 보군요.", advanceMode: "click" },
      ]),
    [],
  );
  const secondSequence = useMemo(
    () =>
      createDialogueSequence("floor-1-memory-completion-second", [
        { id: "show-theo", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
        { id: "theo-surprised", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "...!", advanceMode: "click" },
        { id: "hide-theo", type: "hidePortrait", actorId: "theo" },
        { id: "show-luna", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
        { id: "luna-line", type: "dialogue", speakerId: "luna", speakerName: "루나", activeActorId: "luna", text: "대장!\n던전 2층으로 가는 문이 열린 것 같아.", advanceMode: "click" },
        { id: "hide-luna", type: "hidePortrait", actorId: "luna" },
        { id: "show-kaiden", type: "showPortrait", actorId: "kaiden", portraitId: "serious", position: "left", transition: "fade" },
        { id: "kaiden-line", type: "dialogue", speakerId: "kaiden", speakerName: "카이든", activeActorId: "kaiden", text: "그래.\n이제 다음 계획을 세워야겠군.", advanceMode: "click" },
      ]),
    [],
  );

  useEffect(() => {
    if (phase !== "before") return;
    const timer = window.setTimeout(() => setPhase("fade"), 3000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fade") return;
    const timer = window.setTimeout(() => setPhase("firstDialogue"), 700);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "shake") return;
    const timer = window.setTimeout(() => setPhase("secondDialogue"), 1500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const joined =
    phase === "firstDialogue" ||
    phase === "shake" ||
    phase === "secondDialogue";

  return (
    <div
      className="base-camp-story-overlay"
      style={
        phase === "shake"
          ? {
              animationName: "combat-critical-shake",
              animationDuration: "260ms",
              animationTimingFunction: "ease-out",
              animationIterationCount: 6,
            }
          : undefined
      }
    >
      <div className="dungeon-room-event-image">
        <img
          src={joined ? afterUrl : beforeUrl}
          alt={
            joined
              ? "완성된 고조선 건국 비석"
              : "서로 연결되기 전의 두 기억 조각"
          }
          style={{
            opacity: phase === "fade" ? 0 : 1,
            transition: "opacity 700ms ease",
          }}
        />
      </div>
      {phase === "firstDialogue" && (
        <StoryPlayer
          sequence={firstSequence}
          onNavigate={() => undefined}
          onComplete={() => setPhase("shake")}
          presentationMode="baseCampOverlay"
        />
      )}
      {phase === "secondDialogue" && (
        <StoryPlayer
          sequence={secondSequence}
          onNavigate={() => undefined}
          onComplete={onComplete}
          presentationMode="baseCampOverlay"
        />
      )}
    </div>
  );
}
