import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon9/${name}`;
const ACTOR_IDS = ["luna", "kaiden", "theo"] as const;
type ActorId = (typeof ACTOR_IDS)[number];

function actor(id: ActorId, name: string, role: string): StoryActor {
  return {
    id,
    name,
    role,
    portraits: {
      default: {
        imageUrl: NPC_PORTRAIT_REGISTRY[`${id}.default`],
        placeholder: {
          label: name,
          subtitle: role,
          gradient: "linear-gradient(135deg,#30291f,#111)",
        },
      },
    },
  };
}

const actors = {
  luna: actor("luna", "루나", "지형 분석가"),
  kaiden: actor("kaiden", "카이든", "지휘관"),
  theo: actor("theo", "테오", "보급 담당"),
};

function speak(
  id: string,
  actorId: ActorId,
  speakerName: string,
  text: string,
): StoryStep[] {
  return [
    ...ACTOR_IDS.map((idToHide): StoryStep => ({
      id: `${id}-hide-${idToHide}`,
      type: "hidePortrait",
      actorId: idToHide,
      durationMs: 0,
    })),
    {
      id: `${id}-show`,
      type: "showPortrait",
      actorId,
      portraitId: "default",
      position: "left",
      transition: "fade",
      durationMs: 0,
    },
    {
      id,
      type: "dialogue",
      speakerId: actorId,
      speakerName,
      activeActorId: actorId,
      text,
      advanceMode: "click",
    },
  ];
}

const clueDefinitions = [
  {
    title: "조반 부부 초상",
    image: "joban-couple-portrait.png",
    actorId: "theo",
    speakerName: "테오",
    lines: [
      " 이건..!",
      " 조반 부부 초상입니다. 남편과 아내의 크기가 같게 그려진 것으로 보아, 그 당시 남편과 아내의 지위가 비교적으로 평등했다는 것을 알 수 있죠. ",
      " 확실히, 고려 시기의 사회를 나타내는 증거로군요. 가져갑시다. ",
    ],
  },
  {
    title: "고려 청자 조각",
    image: "goryeo-celadon-fragment.png",
    actorId: "luna",
    speakerName: "루나",
    lines: [
      " 이건! 그 유명하다는 고려 청자의 조각 아니야?!",
      " 고려시대 우리나라의 대표적인 도자기야!!! 고려시대의 자기문화가 얼마나 발달했는지를 보여주지! ",
      " 이건 확실해!  가져가자! ",
    ],
  },
  {
    title: "팔만대장경",
    image: "tripitaka-koreana.png",
    actorId: "kaiden",
    speakerName: "카이든",
    lines: [
      " 이건..",
      " 팔만대장경이군. 위기의 상황에서 몽골의 침입을 불교의 힘을 빌려 막고자 한 목판이지.  ",
      " 고려시대의 종교를 알 수 있는 증거다. 가져가자. ",
    ],
  },
] as const;

function clueStory(index: 0 | 1 | 2): StorySequence {
  const clue = clueDefinitions[index];
  const actorId = clue.actorId as ActorId;
  return {
    id: `dungeon9-clue-${index + 1}`,
    title: clue.title,
    replayable: false,
    skippable: false,
    onCompleteScreen: "dungeon",
    backgrounds: {},
    actors,
    scenes: [{
      id: `dungeon9-clue-${index + 1}-scene`,
      steps: [
        {
          id: `clue-${index + 1}-in`,
          type: "illustOverlay",
          imageUrl: asset(clue.image),
          visible: true,
          fadeMs: 350,
          hideDialogue: true,
          waitForFade: true,
          advanceMode: "auto",
        },
        { id: `clue-${index + 1}-wait`, type: "wait", durationMs: 1500, advanceMode: "auto" },
        ...speak(`clue-${index + 1}-line-1`, actorId, clue.speakerName, clue.lines[0]),
        ...speak(`clue-${index + 1}-line-2`, actorId, clue.speakerName, clue.lines[1]),
        ...speak(`clue-${index + 1}-line-3`, actorId, clue.speakerName, clue.lines[2]),
        {
          id: `clue-${index + 1}-out`,
          type: "illustOverlay",
          visible: false,
          fadeMs: 350,
          hideDialogue: true,
          waitForFade: true,
          advanceMode: "auto",
        },
      ],
    }],
  };
}

export const DUNGEON9_CLUE_STORIES = [
  clueStory(0),
  clueStory(1),
  clueStory(2),
] as const;

export const DUNGEON9_FINAL_STORY: StorySequence = {
  id: "dungeon9-final-story",
  title: "고려시대의 사회와 문화",
  replayable: false,
  skippable: false,
  onCompleteScreen: "dungeon",
  backgrounds: {},
  actors,
  scenes: [{
    id: "dungeon9-final-scene",
    steps: [
      {
        id: "closed-tenth-floor-door-in",
        type: "illustOverlay",
        imageUrl: asset("closed-tenth-floor-door.png"),
        visible: true,
        fadeMs: 350,
        hideDialogue: true,
        waitForFade: true,
        advanceMode: "auto",
      },
      { id: "closed-door-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      ...speak("luna-ominous", "luna", "루나", " 아우.. 진짜 으스스하네. 누가봐도 저기에 뭔가 있어 보이잖아! "),
      ...speak("theo-calm", "theo", "테오", " 진정하십시오, 루나. "),
      ...speak("theo-duty", "theo", "테오", " 당신 말대로 정말 불길하지만.. 우리는 세계 곳곳의 포탈을 해결하는 어드벤처 아카데미 대원입니다. "),
      ...speak("kaiden-duty", "kaiden", "카이든", " 테오 말이 맞다. 이 포탈을 해결하려면 이 문을 열고, 저 문 안에 있는 문제덩어리를 해치워야만 해. 그것이 무엇이든. "),
      ...speak("luna-resolve", "luna", "루나", " 으으으.. 알고 있다구! 그리고 공민왕 아저씨의 얼굴을 봐서라도, 난 절대 도망 안 쳐!"),
      ...speak("kaiden-evidence", "kaiden", "카이든", " ... 그러면, 제단 위에 모은 증거들을 올려놓지. "),
      {
        id: "closed-tenth-floor-door-out",
        type: "illustOverlay",
        visible: false,
        fadeMs: 350,
        hideDialogue: true,
        waitForFade: true,
        advanceMode: "auto",
      },
      {
        id: "evidence-altar-in",
        type: "illustOverlay",
        imageUrl: asset("evidence-altar.png"),
        visible: true,
        fadeMs: 350,
        hideDialogue: true,
        waitForFade: true,
        advanceMode: "auto",
      },
      { id: "evidence-altar-wait", type: "wait", durationMs: 1000, advanceMode: "auto" },
      { id: "evidence-altar-shake", type: "shake", durationMs: 1500, amplitude: 12, hideDialogue: true, advanceMode: "auto" },
      ...speak("theo-surprised", "theo", "테오", "...! "),
      {
        id: "evidence-altar-out",
        type: "illustOverlay",
        visible: false,
        fadeMs: 350,
        hideDialogue: true,
        waitForFade: true,
        advanceMode: "auto",
      },
      {
        id: "open-tenth-floor-door-in",
        type: "illustOverlay",
        imageUrl: asset("open-tenth-floor-door.png"),
        visible: true,
        fadeMs: 350,
        hideDialogue: true,
        waitForFade: true,
        advanceMode: "auto",
      },
      { id: "open-door-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      ...speak("theo-opened", "theo", "테오", " ..문이 열렸군요. "),
      ...speak("theo-smell", "theo", "테오", " 윽! 악취가 심합니다. "),
      ...speak("kaiden-return", "kaiden", "카이든", " 우선 베이스캠프로 돌아간다! 태세를 정비한 후 다시 오도록 하지. "),
      {
        id: "open-tenth-floor-door-out",
        type: "illustOverlay",
        visible: false,
        fadeMs: 350,
        hideDialogue: true,
        waitForFade: true,
        advanceMode: "auto",
      },
    ],
  }],
};
