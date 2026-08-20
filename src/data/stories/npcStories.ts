import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../../game/npc/npcPresentationResolver";
import type { NpcId } from "../../game/npc/npcTypes";

function sequence(
  id: string,
  npcId: NpcId,
  portraitId: string,
  lines: Array<string | { text: string; emphasis: "danger" | "info" }>,
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

const COMPLETION_ACTOR_IDS: NpcId[] = ["luna", "theo", "kaiden", "jeon"];

function singleSpeakerDialogue(
  id: string,
  npcId: NpcId,
  portraitId: string,
  text: string,
): StoryStep[] {
  const npc = resolveNpcPresentation(npcId);
  return [
    ...COMPLETION_ACTOR_IDS.map((actorId): StoryStep => ({
      id: `${id}-hide-${actorId}`,
      type: "hidePortrait",
      actorId,
    })),
    {
      id: `${id}-show`,
      type: "showPortrait",
      actorId: npcId,
      portraitId,
      position: "left",
      transition: "fade",
    },
    {
      id: `${id}-dialogue`,
      type: "dialogue",
      speakerId: npcId,
      speakerName: npc.displayName,
      activeActorId: npcId,
      text,
      advanceMode: "click",
    },
  ];
}

function floor5QuestDialogue(id: string, npcId: NpcId, portraitId: string, text: string): StoryStep[] {
  return singleSpeakerDialogue(id, npcId, portraitId, text).map((step) =>
    step.type === "hidePortrait" || step.type === "showPortrait"
      ? { ...step, durationMs: 0 }
      : step
  );
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
      "던전 3층에서 네가 찾아온 천조각 기억해? 아무래도 삼국 시대의 물건이 아니라서 혼란스러웠지..",
      "던전 4층을 순찰하고 왔는데, 던전 너머에서 이것과 비슷한 수상한 낌새가 느껴져.",
      "{{playerName}}, 던전 4층 너머에 있는 \"수상한 것\"을 찾아 줄래?",
    ],
  ),
  "npc-luna-floor-4-quest-accepted": sequence(
    "npc-luna-floor-4-quest-accepted",
    "luna",
    "happy",
    ["화이팅이야. 위험하면 언제든 다시 베이스 캠프로 돌아와야 해."],
  ),
  "npc-luna-floor-4-quest-active": sequence(
    "npc-luna-floor-4-quest-active",
    "luna",
    "happy",
    ["던전 4층 너머의 수상한 낌새를 찾아줘. 위험하면 바로 돌아와야 해!"],
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
      ...singleSpeakerDialogue("luna-1", "luna", "happy", "어라, 그 사람은..?"),
      ...singleSpeakerDialogue("theo-1", "theo", "default", "던전 안에 사람이 있었습니까..?"),
      ...singleSpeakerDialogue("luna-2", "luna", "happy", "틀림 없어. 수상한 냄새. 내가 말했던 수상한 것이 바로 이 사람이구나!"),
      ...singleSpeakerDialogue("theo-2", "theo", "default", "3층에서 발견된 천조각은 이 분의 것이었나 보군요."),
      ...singleSpeakerDialogue("kaiden-1", "kaiden", "serious", "당신, 이름이 뭐지?"),
      ...singleSpeakerDialogue("jeon-1", "jeon", "default", "사실.. 기억이 온전치 않습니다. 기억하는 것은 오로지 '전'이라는 이름뿐이지요."),
      ...singleSpeakerDialogue("luna-3", "luna", "happy", "전..? 전이라고? 사람 이름이 전?"),
      ...singleSpeakerDialogue("theo-3", "theo", "default", "루나. 그만하십시오. 이름으로 놀리는 것은 굉장히 실례되는 일입니다."),
      ...singleSpeakerDialogue("luna-4", "luna", "happy", "앗... 미안해요, 아저씨."),
      ...singleSpeakerDialogue("jeon-2", "jeon", "default", "괜찮습니다. 저도 제 이름 같지 않은걸요."),
      ...singleSpeakerDialogue("kaiden-2", "kaiden", "serious", "전. 당신이 누구인지는 모르겠으나 우선 이 베이스캠프에서 지내도록. 던전은 위험하니 우리와 함께하는 것이 좋을 테지."),
      ...singleSpeakerDialogue("luna-5", "luna", "happy", "헤헤. 잘 부탁해요, 아저씨."),
      ...singleSpeakerDialogue("theo-4", "theo", "default", "잘 부탁드립니다. 이 던전을 함께 탈출합시다."),
      ...singleSpeakerDialogue("jeon-3", "jeon", "default", "예. 감사합니다. 잘 부탁드립니다."),
    ],
  }],
};

NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-available"] = {
  id: "npc-theo-floor-5-quest-available", title: "던전 5층 의뢰", replayable: true, skippable: false,
  onCompleteScreen: "baseCamp", backgrounds: {},
  actors: { theo: actor("theo", "default"), kaiden: actor("kaiden", "serious"), jeon: actor("jeon", "default") },
  scenes: [{ id: "npc-theo-floor-5-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor5-theo-1", "theo", "default", "어서오십시오, {{playerName}}."),
    ...floor5QuestDialogue("floor5-theo-2", "theo", "default", "이제 던전 5층으로 향할 차례이지요."),
    ...floor5QuestDialogue("floor5-theo-3", "theo", "default", "루나가 먼저 정찰을 다녀왔는데, 입구에서는 어떤 수상한 것도 발견하지 못했다고 합니다."),
    ...floor5QuestDialogue("floor5-theo-4", "theo", "default", "즉.. 아무런 정보가 없는 셈이지요."),
    ...floor5QuestDialogue("floor5-kaiden-1", "kaiden", "serious", "그래. 그래서 이번에는 아무래도 다 같이 들어가는 게 좋을 것 같다."),
    ...floor5QuestDialogue("floor5-kaiden-2", "kaiden", "serious", "안에 어떤 단서가 있을지 모르니 위험하더라도 같이 움직이는 것이 파악하기에 수월할테니.."),
    ...floor5QuestDialogue("floor5-jeon-1", "jeon", "default", "도움이 될지는 모르겠으나, 저 또한 힘내겠습니다."),
  ] }],
};
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-accepted"] = sequence("npc-theo-floor-5-quest-accepted", "theo", "default", ["{{playerName}}, 준비를 마치고 함께 5층으로 들어갑시다."]);
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-active"] = sequence("npc-theo-floor-5-quest-active", "theo", "default", ["준비가 되면 함께 던전 5층으로 들어갑시다."]);
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-active"].scenes[0].steps.push({
  id: "npc-theo-floor-5-quest-active-choice",
  type: "choice",
  prompt: "무엇을 하시겠습니까?",
  advanceMode: "click",
  options: [
    { id: "buy-items", label: "아이템 사기", actionId: "open-theo-shop", closeStory: true },
    { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
  ],
});
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-complete"] = sequence("npc-theo-floor-5-quest-complete", "theo", "default", ["{{playerName}}, 수고하셨습니다. 이제 다음 계획을 세우지요."]);

NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-available"] = {
  id: "npc-kaiden-floor-6-quest-available", title: "던전 6층 의뢰", replayable: true, skippable: false,
  onCompleteScreen: "baseCamp", backgrounds: {},
  actors: { kaiden: actor("kaiden", "serious"), luna: actor("luna", "happy"), theo: actor("theo", "default"), jeon: actor("jeon", "default") },
  scenes: [{ id: "npc-kaiden-floor-6-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor6-kaiden-1", "kaiden", "serious", "{{playerName}}, 고생이 많군. 이제 6층을 탐색할 차례이지?"),
    ...floor5QuestDialogue("floor6-kaiden-2", "kaiden", "serious", "이번에도 먼저 루나가 다녀왔는데.. 아무래도 던전 6층에는 유령이 있는 것 같다고 하더군."),
    ...floor5QuestDialogue("floor6-luna-1", "luna", "happy", "안녕~ {{playerName}}. 대장, 말하는 중에 끼어들어서 미안해. 직접 설명하는게 좋을 것 같아서."),
    ...floor5QuestDialogue("floor6-kaiden-3", "kaiden", "serious", "상관 없다. 자세히 설명해 봐."),
    ...floor5QuestDialogue("floor6-luna-2", "luna", "happy", "그러니까.. 내가 정찰로 던전 6층 입구를 먼저 열어봤는데, 열자마자 어떤 목소리가 들려왔어."),
    ...floor5QuestDialogue("floor6-luna-3", "luna", "happy", "모습은 보이지 않아서 누구인지는 잘 모르겠는데... 어쨌든 간절한 목소리였어."),
    ...floor5QuestDialogue("floor6-luna-4", "luna", "happy", "마치.. 나에게 뭔가를 부탁하는 것처럼."),
    ...floor5QuestDialogue("floor6-theo-1", "theo", "default", "그 부탁을 들어줘야 다음 층으로 보내줄 것 같다는 뜻입니까?"),
    ...floor5QuestDialogue("floor6-luna-5", "luna", "happy", "정확해.... 그런데 아무래도 {{playerName}} 혼자서는 힘들 수도 있겠다는 생각이 들어서."),
    ...floor5QuestDialogue("floor6-kaiden-4", "kaiden", "serious", "...그럼 '전'과 함께 가는 게 좋겠군."),
    ...floor5QuestDialogue("floor6-kaiden-5", "kaiden", "serious", "5층에서 보여준 전의 능력을 보면, 이번에도 전이 큰 역할을 해 줄지도 모른다."),
    ...floor5QuestDialogue("floor6-kaiden-6", "kaiden", "serious", "어떻게 생각하지?"),
  ] }],
};
NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-accepted"] = sequence("npc-kaiden-floor-6-quest-accepted", "jeon", "default", ["잘 부탁드립니다, {{playerName}}."]);
NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-active"] = sequence("npc-kaiden-floor-6-quest-active", "kaiden", "serious", ["전과 함께 던전 6층의 목소리를 조사하도록."]);
NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-complete"] = sequence("npc-kaiden-floor-6-quest-complete", "kaiden", "serious", [
  "왔는가. 다음 층의 입구가 열렸다는 것은 알고 있네.",
  "그래, 발해 유민들의 정체성을 찾아주었다고..",
  "수고했다. 둘이서 대단한 일을 해냈군.",
  "이제 다음 계획을 세우지.",
]);

NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-available"] = {
  id: "npc-theo-floor-7-quest-available",
  title: "던전 7층 의뢰",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    theo: actor("theo", "default"),
    kaiden: actor("kaiden", "serious"),
    luna: actor("luna", "happy"),
    jeon: actor("jeon", "default"),
  },
  scenes: [{ id: "npc-theo-floor-7-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor7-theo-1", "theo", "default", "(플레이어 이름), 어서 오십시오."),
    ...floor5QuestDialogue("floor7-theo-2", "theo", "default", "전과 당신이 노력해주신 덕분에, 다음 층이 열렸지요. 정말 감사합니다."),
    ...floor5QuestDialogue("floor7-theo-3", "theo", "default", "이번에도 루나가 먼저 다녀왔습니다만.. 우선 이 사진을 함께 보시지요."),
    { id: "floor7-broken-door-in", type: "illustOverlay", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon7/broken-door.png`, visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "floor7-broken-door-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
    ...floor5QuestDialogue("floor7-theo-4", "theo", "default", "이 문이 다음 층으로 가는 입구를 가로막고 있었다고 합니다."),
    ...floor5QuestDialogue("floor7-theo-5", "theo", "default", "문에는 이렇게 적혀있습니다."),
    ...floor5QuestDialogue("floor7-theo-6", "theo", "default", "...을 한데 모아 고려의 기둥을 바로 세워라.").map((step) => step.type === "dialogue" ? { ...step, emphasis: "info" as const } : step),
    ...floor5QuestDialogue("floor7-theo-7", "theo", "default", "문제는 무엇을 한데 모으라는 것인지 나와 있지 않는다는 것입니다."),
    ...floor5QuestDialogue("floor7-kaiden-1", "kaiden", "serious", "아마도 호족과 관련 있을 것이다."),
    ...floor5QuestDialogue("floor7-theo-8", "theo", "default", "...! 그렇군요."),
    ...floor5QuestDialogue("floor7-theo-9", "theo", "default", "고려 건국에서 호족이 빠질 수는 없으니까요."),
    ...floor5QuestDialogue("floor7-theo-10", "theo", "default", "고려 건국 이후에도 호족을 포섭하려 노력했었고요."),
    { id: "floor7-broken-door-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "floor7-broken-door-out-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
    ...floor5QuestDialogue("floor7-luna-1", "luna", "happy", "그렇다면 모으라는 것은 호족의 증표 같은 것이겠네!"),
    ...floor5QuestDialogue("floor7-theo-11", "theo", "default", "분명 그럴 것입니다."),
    ...floor5QuestDialogue("floor7-theo-12", "theo", "default", "(플레이어 이름), 이번에도 부탁드려도 괜찮겠습니까?"),
    ...floor5QuestDialogue("floor7-jeon-1", "jeon", "default", "잠깐... 이번에도 저를 데려가 주십시오!... <red><b>윽!</b></red>"),
    ...floor5QuestDialogue("floor7-theo-13", "theo", "default", "전?! 무슨 일입니까?"),
    ...floor5QuestDialogue("floor7-jeon-2", "jeon", "default", "갑작스럽게 죄송합니다..사실 아까부터 가벼운 두통이 있어서요...별일 아닙니다."),
    ...floor5QuestDialogue("floor7-luna-2", "luna", "happy", "두통이요? 전 아저씨, 아플 땐 쉬어야 해요. 무리하지 말고요!"),
    ...floor5QuestDialogue("floor7-theo-14", "theo", "default", "루나 말이 맞습니다."),
    ...floor5QuestDialogue("floor7-jeon-3", "jeon", "default", "하지만...여러분의 도움만 받기는..."),
    ...floor5QuestDialogue("floor7-kaiden-2", "kaiden", "serious", "..그렇게 하지. 전도 데려가도록 해."),
    ...floor5QuestDialogue("floor7-kaiden-3", "kaiden", "serious", "6층에서도 전이 옛 문서를 해석해준 덕분에 쉽게 문을 열 수 있지 않았나. 이번에도 도움이 될 지도 모르니."),
    ...floor5QuestDialogue("floor7-theo-15", "theo", "default", "대장..."),
    ...floor5QuestDialogue("floor7-theo-16", "theo", "default", "알겠습니다. (플레이어 이름), 부탁드려도 괜찮겠습니까?"),
  ] }],
};
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-accepted"] = sequence("npc-theo-floor-7-quest-accepted", "theo", "default", [
  "이번에도 기다리고 있겠습니다. 부디 무리는 하지 마시길.",
]);
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-active"] = sequence("npc-theo-floor-7-quest-active", "theo", "default", [
  "전과 함께 던전 7층에서 호족의 증표를 찾아주십시오.",
]);
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-active"].scenes[0].steps.push({
  id: "npc-theo-floor-7-quest-active-choice",
  type: "choice",
  prompt: "무엇을 하시겠습니까?",
  advanceMode: "click",
  options: [
    { id: "buy-items", label: "아이템 사기", actionId: "open-theo-shop", closeStory: true },
    { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
  ],
});
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-complete"] = {
  id: "npc-theo-floor-7-quest-complete",
  title: "던전 7층 조사 완료",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: { theo: actor("theo", "default"), luna: actor("luna", "happy") },
  scenes: [{ id: "npc-theo-floor-7-quest-complete-scene", steps: [
    ...floor5QuestDialogue("floor7-complete-theo-1", "theo", "default", "아, (플레이어 이름), 어서 오십시오."),
    ...floor5QuestDialogue("floor7-complete-theo-2", "theo", "default", "...전?! 대체 무슨 일이 있었던 겁니까?!"),
    ...floor5QuestDialogue("floor7-complete-theo-3", "theo", "default", "그런... 문이 열리자마자 갑자기 쓰러졌다고요."),
    ...floor5QuestDialogue("floor7-complete-theo-4", "theo", "default", "루나, 응급처치를 부탁합니다."),
    ...floor5QuestDialogue("floor7-complete-luna-1", "luna", "happy", "맡겨줘!"),
    ...floor5QuestDialogue("floor7-complete-theo-5", "theo", "default", "후...루나 덕분에 한시름 덜었군요."),
    ...floor5QuestDialogue("floor7-complete-theo-6", "theo", "default", "수고하셨습니다, (플레이어 이름). 덕분에 다음 층이 열렸습니다. 이제 다음 계획을 세우도록 하지요."),
  ] }],
};

NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-available"] = {
  id: "npc-kaiden-floor-8-quest-available",
  title: "던전 8층 의뢰",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    kaiden: actor("kaiden", "serious"),
    luna: actor("luna", "happy"),
    theo: actor("theo", "default"),
    jeon: actor("jeon", "default"),
  },
  scenes: [{ id: "npc-kaiden-floor-8-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor8-kaiden-1", "kaiden", "serious", " 왔군, (플레이어 이름). "),
    ...floor5QuestDialogue("floor8-kaiden-2", "kaiden", "serious", " 다음층으로 갈 계획을 세우고자 루나가 정찰을 갔다 왔다고 한다.. 그런데. "),
    ...floor5QuestDialogue("floor8-luna-1", "luna", "happy", " 헤헤..이번에도 아무런 낌새를 발견하지 못했어. "),
    ...floor5QuestDialogue("floor8-kaiden-3", "kaiden", "serious", " 아무래도 던전 안쪽에서 직접 단서를 찾아야 할것 같다. "),
    ...floor5QuestDialogue("floor8-kaiden-4", "kaiden", "serious", " 지난번에 그랬던것처럼, 이번에도 우리 모두 함께 던전에 들어간다는 뜻이지. "),
    ...floor5QuestDialogue("floor8-theo-1", "theo", "default", " 전은 제외입니다. 전은 부상자이니, 베이스캠프에서 휴식하도록 하죠. "),
    ...floor5QuestDialogue("floor8-jeon-1", "jeon", "default", " 도움이 되지 못해 죄송합니다.. "),
    ...floor5QuestDialogue("floor8-luna-2", "luna", "happy", " 그런 말 마요. 지금까지 전 아저씨의 활약이 엄청났는걸요! 이번엔 저희도 좀 활약하게 해 주세요! "),
    ...floor5QuestDialogue("floor8-jeon-2", "jeon", "default", " 하하.. 믿고 맡기겠습니다. "),
    ...floor5QuestDialogue("floor8-kaiden-5", "kaiden", "serious", " 준비가 되었다면 바로 출발하지. "),
  ] }],
};
NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-accepted"] = sequence(
  "npc-kaiden-floor-8-quest-accepted",
  "kaiden",
  "serious",
  [" 우리는 단서를 찾을테니, 늘 그렇듯 전투를 잘 부탁하겠다. (플레이어 이름). "],
);
NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-active"] = sequence(
  "npc-kaiden-floor-8-quest-active",
  "kaiden",
  "serious",
  ["동료들과 함께 던전 8층 안쪽에서 단서를 찾도록."],
);
NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-complete"] = sequence(
  "npc-kaiden-floor-8-quest-complete",
  "kaiden",
  "serious",
  [
    " (플레이어 이름), 이번에도 수고했다. ",
    " 전이 사라지니 테오도 루나도 조금 우울해보이지만, 그들도 조금 있으면 잘 이겨내겠지. ",
    " 조금 휴식한 뒤 출발하는 것이 좋겠군. ",
  ],
);

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
