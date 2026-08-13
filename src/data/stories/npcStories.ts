import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
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

function actor(npcId: NpcId, portraitId: string): StoryActor {
  const npc = resolveNpcPresentation(npcId);
  return {
    id: npcId,
    name: npc.displayName,
    role: npc.role,
    portraits: {
      [portraitId]: {
        imageUrl: NPC_PORTRAIT_REGISTRY[`${npcId}.${portraitId}`] ?? NPC_PORTRAIT_REGISTRY[`${npcId}.default`],
        placeholder: { label: npc.displayName, subtitle: npc.role, gradient: "linear-gradient(135deg, #30291f, #111)" },
      },
    },
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
  "npc-luna-floor-4-quest-available": sequence(
    "npc-luna-floor-4-quest-available",
    "luna",
    "happy",
    [
      "{{playerName}}! 왔구나!",
      "던전 3층에서 네가 찾아온 천조각 기억해?\n아무래도 삼국 시대의 물건이 아니라서 혼란스러웠지..",
      "던전 4층을 순찰하고 왔는데,\n던전 너머에서 이것과 비슷한\n수상한 낌새가 느껴져.",
      "{{playerName}},\n던전 4층 너머에 있는\n\"수상한 것\"을 찾아 줄래?",
    ],
  ),
  "npc-luna-floor-4-quest-accepted": sequence(
    "npc-luna-floor-4-quest-accepted",
    "luna",
    "happy",
    ["화이팅이야.\n위험하면 언제든 다시 베이스 캠프로 돌아와야 해."],
  ),
  "npc-luna-floor-4-quest-active": sequence(
    "npc-luna-floor-4-quest-active",
    "luna",
    "happy",
    ["던전 4층 너머의 수상한 낌새를 찾아줘.\n위험하면 바로 돌아와야 해!"],
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
  "npc-jeon-default": sequence("npc-jeon-default", "jeon", "default", [
    "...나는...\n누구지..?",
  ]),
};

NPC_STORY_SEQUENCES["npc-luna-floor-4-quest-complete"] = {
  id: "npc-luna-floor-4-quest-complete",
  title: "던전 4층 조사 완료",
  replayable: false,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    luna: actor("luna", "happy"),
    theo: actor("theo", "default"),
    kaiden: actor("kaiden", "serious"),
    jeon: actor("jeon", "default"),
  },
  scenes: [{
    id: "npc-luna-floor-4-quest-complete-scene",
    steps: [
      { id: "show-luna-1", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
      { id: "luna-1", type: "dialogue", speakerId: "luna", speakerName: "루나", activeActorId: "luna", text: "어라,\n그 사람은..?", advanceMode: "click" },
      { id: "show-theo-1", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
      { id: "theo-1", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "던전 안에 사람이 있었습니까..?", advanceMode: "click" },
      { id: "show-luna-2", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
      { id: "luna-2", type: "dialogue", speakerId: "luna", speakerName: "루나", activeActorId: "luna", text: "틀림 없어.\n\n수상한 냄새.\n\n내가 말했던 수상한 것이\n바로 이 사람이구나!", advanceMode: "click" },
      { id: "show-theo-2", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
      { id: "theo-2", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "3층에서 발견된 천조각은\n\n이 분의 것이었나 보군요.", advanceMode: "click" },
      { id: "show-kaiden-1", type: "showPortrait", actorId: "kaiden", portraitId: "serious", position: "left", transition: "fade" },
      { id: "kaiden-1", type: "dialogue", speakerId: "kaiden", speakerName: "카이든", activeActorId: "kaiden", text: "당신,\n이름이 뭐지?", advanceMode: "click" },
      { id: "show-jeon-1", type: "showPortrait", actorId: "jeon", portraitId: "default", position: "left", transition: "fade" },
      { id: "jeon-1", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "사실..\n\n기억이 온전치 않습니다.\n\n기억하는 것은\n\n오로지\n\n'전'\n\n이라는 이름뿐이지요.", advanceMode: "click" },
      { id: "show-luna-3", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
      { id: "luna-3", type: "dialogue", speakerId: "luna", speakerName: "루나", activeActorId: "luna", text: "전..?\n\n전이라고?\n\n사람 이름이 전?", advanceMode: "click" },
      { id: "show-theo-3", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
      { id: "theo-3", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "루나.\n\n그만하십시오.\n\n이름으로 놀리는 것은\n\n굉장히 실례되는 일입니다.", advanceMode: "click" },
      { id: "show-luna-4", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
      { id: "luna-4", type: "dialogue", speakerId: "luna", speakerName: "루나", activeActorId: "luna", text: "앗...\n\n미안해요,\n아저씨.", advanceMode: "click" },
      { id: "show-jeon-2", type: "showPortrait", actorId: "jeon", portraitId: "default", position: "left", transition: "fade" },
      { id: "jeon-2", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "괜찮습니다.\n\n저도\n제 이름 같지 않은걸요.", advanceMode: "click" },
      { id: "show-kaiden-2", type: "showPortrait", actorId: "kaiden", portraitId: "serious", position: "left", transition: "fade" },
      { id: "kaiden-2", type: "dialogue", speakerId: "kaiden", speakerName: "카이든", activeActorId: "kaiden", text: "전.\n\n당신이 누구인지는 모르겠으나\n\n우선\n\n이 베이스캠프에서 지내도록.\n\n던전은 위험하니\n\n우리와 함께하는 것이 좋을 테지.", advanceMode: "click" },
      { id: "show-luna-5", type: "showPortrait", actorId: "luna", portraitId: "happy", position: "left", transition: "fade" },
      { id: "luna-5", type: "dialogue", speakerId: "luna", speakerName: "루나", activeActorId: "luna", text: "헤헤.\n\n잘 부탁해요,\n아저씨.", advanceMode: "click" },
      { id: "show-theo-4", type: "showPortrait", actorId: "theo", portraitId: "default", position: "left", transition: "fade" },
      { id: "theo-4", type: "dialogue", speakerId: "theo", speakerName: "테오", activeActorId: "theo", text: "잘 부탁드립니다.\n\n이 던전을 함께 탈출합시다.", advanceMode: "click" },
      { id: "show-jeon-3", type: "showPortrait", actorId: "jeon", portraitId: "default", position: "left", transition: "fade" },
      { id: "jeon-3", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "예.\n\n감사합니다.\n\n잘 부탁드립니다.", advanceMode: "click" },
    ],
  }],
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
