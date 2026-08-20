import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon7/${name}`;

const jeon: StoryActor = {
  id: "jeon",
  name: "전",
  role: "기억을 잃은 남자",
  portraits: {
    default: {
      imageUrl: NPC_PORTRAIT_REGISTRY["jeon.default"],
      placeholder: {
        label: "전",
        subtitle: "기억을 잃은 남자",
        gradient: "linear-gradient(135deg,#30291f,#111)",
      },
    },
  },
};

const dialogue = (id: string, text: string, emphasis?: "danger"): StoryStep => ({
  id,
  type: "dialogue",
  speakerId: "jeon",
  speakerName: "전",
  activeActorId: "jeon",
  text,
  ...(emphasis ? { emphasis } : {}),
  advanceMode: "click",
});

const showJeon = (id: string): StoryStep => ({
  id,
  type: "showPortrait",
  actorId: "jeon",
  portraitId: "default",
  position: "left",
  transition: "fade",
  durationMs: 0,
});

const clueTexts = [
  [
    "이것은...! 사성 제도와 관련된 문서입니다.",
    "태조 왕건은 호족을 포섭하기 위해 유력 호족들에게 왕씨 성을 하사했지요.",
    "호족의 증표라 할 수 있겠습니다. 가져갑시다.",
  ],
  [
    "이것은...! 혼인과 관련된 문서입니다.",
    "태조 왕건은 지방 호족들과 정략혼인을 치렀습니다.",
    "호족의 증표라 할 수 있겠습니다. 가져갑시다.",
  ],
  [
    "이것은...! 기인 제도와 관련된 문서입니다.",
    "지방 호족을 포섭하면서도 견제하기 위해 호족 자제를 수도에 머무르게 했습니다.",
    "호족의 증표라 할 수 있겠습니다. 가져갑시다.",
  ],
] as const;

function clueStory(index: 0 | 1 | 2): StorySequence {
  return {
    id: `dungeon7-clue-${index + 1}`,
    title: `호족의 증표 ${index + 1}`,
    replayable: false,
    skippable: false,
    onCompleteScreen: "dungeon",
    backgrounds: {},
    actors: { jeon },
    scenes: [{
      id: `clue-${index + 1}`,
      steps: [
        { id: "document-in", type: "illustOverlay", imageUrl: asset("document-fragment.png"), visible: true, fadeMs: 350, advanceMode: "auto" },
        showJeon("show-jeon"),
        dialogue("line-1", clueTexts[index][0]),
        dialogue("line-2", clueTexts[index][1]),
        dialogue("line-3", clueTexts[index][2]),
        { id: "document-out", type: "illustOverlay", visible: false, fadeMs: 350, advanceMode: "auto" },
      ],
    }],
  };
}

export const DUNGEON7_CLUE_STORIES = [clueStory(0), clueStory(1), clueStory(2)] as const;

export const DUNGEON7_FINAL_STORY: StorySequence = {
  id: "dungeon7-final-story",
  title: "고려의 기둥",
  replayable: false,
  skippable: false,
  onCompleteScreen: "dungeon",
  backgrounds: {},
  actors: { jeon },
  scenes: [{
    id: "final",
    steps: [
      { id: "broken-door-in", type: "illustOverlay", imageUrl: asset("broken-door.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "broken-door-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
      showJeon("show-jeon"),
      dialogue("jeon-1", "...사진에서 본 그대로군요."),
      dialogue("jeon-2", "저희의 추측이 맞다면 호족의 증표로 문을 열 수 있을 것입니다."),
      dialogue("jeon-3", "(플레이어 이름), 문을 열어주시겠습니까?"),
      { id: "submit-choice", type: "choice", advanceMode: "click", options: [
        { id: "submit-tokens", label: "호족의 증표를 제출한다.", nextStepId: "broken-door-out" },
      ] },
      { id: "broken-door-out", type: "illustOverlay", visible: false, fadeMs: 300, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "closed-door-in", type: "illustOverlay", imageUrl: asset("closed-door.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "closed-door-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
      dialogue("jeon-4", "...! 기둥이 세워졌습니다!"),
      { id: "open-choice", type: "choice", advanceMode: "click", options: [
        { id: "open-door", label: "문을 연다.", nextStepId: "closed-door-out" },
      ] },
      { id: "closed-door-out", type: "illustOverlay", visible: false, fadeMs: 300, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "open-door-in", type: "illustOverlay", imageUrl: asset("open-door.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "open-door-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
      dialogue("jeon-6", "성공이군요!!"),
      dialogue("jeon-7", "윽!!", "danger"),
      { id: "collapse-shake", type: "shake", durationMs: 1000, amplitude: 12, hideDialogue: true, advanceMode: "auto" },
      { id: "hide-jeon", type: "hidePortrait", actorId: "jeon", durationMs: 0, advanceMode: "auto" },
      { id: "collapse-1", type: "narration", text: "이런! 전이 쓰러졌다!!", advanceMode: "click" },
      { id: "collapse-2", type: "narration", text: "이마가 불덩이같다. 어서 베이스캠프로 데려가자.", advanceMode: "click" },
      { id: "open-door-out", type: "illustOverlay", visible: false, fadeMs: 250, advanceMode: "auto" },
    ],
  }],
};
