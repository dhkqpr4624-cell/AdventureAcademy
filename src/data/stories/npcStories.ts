import type { StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../../game/npc/npcPresentationResolver";
import type { NpcId } from "../../game/npc/npcTypes";

function sequence(
  id: string,
  npcId: NpcId,
  portraitId: string,
  lines: Array<string | { text: string; emphasis: "danger" }>,
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
    ...lines.map((entry, index): StoryStep => ({
      id: `${id}-line-${index + 1}`,
      type: "dialogue",
      speakerId: npcId,
      speakerName: npc.displayName,
      activeActorId: npcId,
      text: typeof entry === "string" ? entry : entry.text,
      ...(typeof entry === "string" ? {} : { emphasis: entry.emphasis }),
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
    "{{playerName}}! 던전은 항상 내가 먼저 정찰하고 있어. 필요한 게 있으면 언제든지 말해!",
  ]),
  "npc-luna-floor-3-quest-available": sequence(
    "npc-luna-floor-3-quest-available",
    "luna",
    "happy",
    [
      "{{playerName}}, 왔구나!",
      "던전 2층에서의 활약은 역시 멋지던걸~",
      "사실... 던전 3층을 조사해 봤는데, 던전 너머에서 뭔가의 기운이 느껴진단 말이지...",
      "나는 전투 능력이 거의 없어서 가 볼 수 없으니, 네가 나 대신 조사해주었으면 해.",
    ],
  ),
  "npc-luna-floor-3-quest-accepted": sequence(
    "npc-luna-floor-3-quest-accepted",
    "luna",
    "happy",
    ["좋아. 뭔가 있으면 알려줘!"],
  ),
  "npc-luna-floor-3-quest-active": sequence(
    "npc-luna-floor-3-quest-active",
    "luna",
    "happy",
    ["던전 3층 너머에서 느껴진 기운이 신경 쓰여. 조심해서 조사해줘!"],
  ),
  "npc-luna-floor-3-quest-complete": sequence(
    "npc-luna-floor-3-quest-complete",
    "luna",
    "happy",
    ["아, {{playerName}}! 왔구나!"],
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
      "왔나, {{playerName}}.",
      "이 던전에서 빠져나가려면, 우선 이 던전이 어떤 던전인지부터 파악해야겠지.",
      "루나가 정찰하려 했지만, 몬스터가 많아 접근이 어렵다는군.",
      "{{playerName}}. 네가 던전 1층을 살펴보고, 이 던전을 파악할 수 있는 물건들을 가져와주겠나?",
    ],
  ),
  "npc-kaiden-quest-complete": sequence(
    "npc-kaiden-quest-complete",
    "kaiden",
    "serious",
    ["{{playerName}}. 돌아왔군. 그것은..?"],
  ),
  "npc-kaiden-quest-active": sequence(
    "npc-kaiden-quest-active",
    "kaiden",
    "serious",
    ["던전 1층에서 이 던전의 정체를 알려 줄 물건들을 찾아오도록."],
  ),
  "npc-kaiden-quest-accepted": sequence(
    "npc-kaiden-quest-accepted",
    "kaiden",
    "serious",
    [
      "좋다. 준비가 된다면 던전 입구를 클릭하여 던전 1층에 다녀오도록.",
      { text: "던전에서 오답을 선택하면 큰 피해를 입게 되니 조심하는 것도 명심해라.", emphasis: "danger" },
    ],
  ),
  "npc-kaiden-floor-2-quest-available": sequence("npc-kaiden-floor-2-quest-available", "kaiden", "serious", [
    "루나의 조사에 따르면, 던전 근처에서 뒤틀린 기억의 조각이 발견되었다고 한다.",
    "분명 던전 2층 안에, 이 조각과 딱 맞는 조각이 1개 더 있을 것으로 보인다.",
    "{{playerName}}, 던전 2층으로 내려가서 뒤틀린 기억의 조각을 찾아 오도록.",
  ]),
  "npc-kaiden-floor-2-quest-accepted": sequence("npc-kaiden-floor-2-quest-accepted", "kaiden", "serious", ["좋다. 던전을 조사한 후 바로 보고하도록."]),
  "npc-kaiden-floor-2-quest-active": sequence("npc-kaiden-floor-2-quest-active", "kaiden", "serious", ["기억 조각은 던전 2층에 있다. 서두르되, 주변을 꼼꼼히 살펴."]),
  "npc-kaiden-floor-2-quest-complete": sequence("npc-kaiden-floor-2-quest-complete", "kaiden", "serious", ["기억의 조각을 가져왔군. 바로 확인해 보겠다."]),
};

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
