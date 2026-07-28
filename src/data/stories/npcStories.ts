import type { StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../../game/npc/npcPresentationResolver";
import type { NpcId } from "../../game/npc/npcTypes";

function sequence(
  id: string,
  npcId: NpcId,
  portraitId: string,
  lines: string[],
): StorySequence {
  const npc = resolveNpcPresentation(npcId);
  const steps: StoryStep[] = [
    {
      id: `${id}-portrait`,
      type: "showPortrait",
      actorId: npcId,
      portraitId,
      position: "left",
      transition: "fade",
    },
    ...lines.map((text, index): StoryStep => ({
      id: `${id}-line-${index + 1}`,
      type: "dialogue",
      speakerId: npcId,
      speakerName: npc.displayName,
      activeActorId: npcId,
      text,
      advanceMode: "click",
    })),
  ];
  return {
    id,
    title: `${npc.displayName} 대화`,
    replayable: true,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {},
    actors: {
      [npcId]: {
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
      },
    },
    scenes: [{ id: `${id}-scene`, steps }],
  };
}

export const NPC_STORY_SEQUENCES: Record<string, StorySequence> = {
  "npc-luna-default": sequence("npc-luna-default", "luna", "happy", [
    "대장~! 캠프 상태는 내가 살펴보고 있었어. 준비가 되면 언제든 말해!",
  ]),
  "npc-theo-default": sequence("npc-theo-default", "theo", "default", [
    "보급품은 차근차근 정리하고 있습니다. 출발 전에는 반드시 장비를 점검해 주십시오.",
  ]),
  "npc-kaiden-default": sequence("npc-kaiden-default", "kaiden", "serious", [
    "던전의 흐름이 불안정하다. 방심하지 마.",
  ]),
  "npc-kaiden-quest-available": sequence(
    "npc-kaiden-quest-available",
    "kaiden",
    "serious",
    [
      "던전 1층에서 뒤틀린 기억의 흔적을 발견했다.",
      "흩어진 기억 조각을 회수해 단서를 확인해야 한다. 네가 맡아 줘.",
    ],
  ),
  "npc-kaiden-quest-active": sequence(
    "npc-kaiden-quest-active",
    "kaiden",
    "serious",
    ["기억 조각은 던전 1층에 있다. 서두르되, 주변을 꼼꼼히 살펴."],
  ),
  "npc-kaiden-quest-accepted": sequence(
    "npc-kaiden-quest-accepted",
    "kaiden",
    "serious",
    ["좋아. 기억 조각을 찾으면 바로 캠프로 돌아와 보고해."],
  ),
};

const theo = NPC_STORY_SEQUENCES["npc-theo-default"];
theo.scenes[0].steps.push(
  {
    id: "npc-theo-default-choice",
    type: "choice",
    prompt: "무엇을 하시겠습니까?",
    advanceMode: "click",
    options: [
      { id: "buy-items", label: "아이템 사기", nextStepId: "npc-theo-shop-pending" },
      { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
    ],
  },
  {
    id: "npc-theo-shop-pending",
    type: "dialogue",
    speakerId: "theo",
    speakerName: "테오",
    activeActorId: "theo",
    text: "상점은 아직 준비 중입니다.",
    advanceMode: "click",
  },
);
