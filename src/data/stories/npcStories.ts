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
    "{{playerName}}! 던전은 항상 내가 먼저 정찰하고 있어.\n필요한 게 있으면 언제든지 말해!",
  ]),
  "npc-luna-floor-2-quest-available": sequence(
    "npc-luna-floor-2-quest-available",
    "luna",
    "happy",
    [
      "{{playerName}}, 왔구나!",
      "던전 1층에서의 활약은 역시 멋지던걸~",
      "사실...\n던전 2층을 조사해 봤는데,\n\n던전 너머에서\n뭔가의 기운이 느껴진단 말이지...",
      "나는 전투 능력이 거의 없어서\n가 볼 수 없으니,\n\n네가 나 대신 조사해주었으면 해.",
    ],
  ),
  "npc-luna-floor-2-quest-accepted": sequence(
    "npc-luna-floor-2-quest-accepted",
    "luna",
    "happy",
    ["좋아.\n뭔가 있으면 알려줘!"],
  ),
  "npc-luna-floor-2-quest-active": sequence(
    "npc-luna-floor-2-quest-active",
    "luna",
    "happy",
    ["던전 2층 너머에서 느껴진 기운이 신경 쓰여.\n조심해서 조사해줘!"],
  ),
  "npc-luna-floor-2-quest-complete": sequence(
    "npc-luna-floor-2-quest-complete",
    "luna",
    "happy",
    ["아,\n{{playerName}}!\n왔구나!"],
  ),
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
      "포탈에 빠져 이 던전에 갇힌 이상,\n이 던전을 클리어해서 나가는 방법밖에는 없다.",
      "루나의 조사에 따르면,\n던전 근처에서 뒤틀린 기억의 조각이 발견되었다고 한다.",
      "분명 던전 1층 안에,\n이 조각과 딱 맞는 조각이 1개 더 있을 것으로 보인다.",
      "{{playerName}},\n던전 1층으로 내려가서\n뒤틀린 기억의 조각을 찾아 오도록.",
    ],
  ),
  "npc-kaiden-quest-complete": sequence(
    "npc-kaiden-quest-complete",
    "kaiden",
    "serious",
    ["기억의 조각을 가져왔군. 바로 확인해 보겠다."],
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
    ["좋다.\n던전을 조사한 후\n바로 보고하도록."],
  ),
};

NPC_STORY_SEQUENCES["npc-kaiden-quest-accepted"].scenes[0].steps.push({
  id: "npc-kaiden-quest-accepted-danger-warning",
  type: "dialogue",
  speakerId: "kaiden",
  speakerName: "카이든",
  activeActorId: "kaiden",
  text: "던전 안에서 오답을 선택할 경우\n마물들이 강해지니 조심해야 한다는 점도\n잊지 말게.",
  emphasis: "danger",
  advanceMode: "click",
});

const theo = NPC_STORY_SEQUENCES["npc-theo-default"];
theo.scenes[0].steps.push(
  {
    id: "npc-theo-default-choice",
    type: "choice",
    prompt: "무엇을 하시겠습니까?",
    advanceMode: "click",
    options: [
      { id: "buy-items", label: "아이템 사기", actionId: "open-theo-shop", closeStory: true },
      { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
    ],
  },
);
