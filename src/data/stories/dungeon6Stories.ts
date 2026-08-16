import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon6/${name}`;

const jeon: StoryActor = {
  id: "jeon", name: "전", role: "기억을 잃은 남자",
  portraits: { default: { imageUrl: NPC_PORTRAIT_REGISTRY["jeon.default"], placeholder: { label: "전", subtitle: "기억을 잃은 남자", gradient: "linear-gradient(135deg,#30291f,#111)" } } },
};

const ghost: StoryActor = {
  id: "balhaeGhost", name: "발해 유민의 혼", role: "길 잃은 혼",
  portraits: {}, accentColor: "#8fdcff",
};

const d = (id: string, speakerId: string, speakerName: string, text: string, emphasis?: "danger"): StoryStep => ({
  id, type: "dialogue", speakerId, speakerName, activeActorId: speakerId, text, ...(emphasis ? { emphasis } : {}), advanceMode: "click",
});

const showJeon: StoryStep = { id: "show-jeon", type: "showPortrait", actorId: "jeon", portraitId: "default", position: "left", transition: "fade", durationMs: 0 };

export const DUNGEON6_ENTRY_STORY: StorySequence = {
  id: "dungeon6-entry-story", title: "던전 6층", replayable: false, skippable: false, onCompleteScreen: "dungeon", backgrounds: {}, actors: { jeon, balhaeGhost: ghost },
  scenes: [{ id: "entry", steps: [
    d("voice-1", "balhaeGhost", "의문의 목소리", ".....줘"),
    d("voice-2", "balhaeGhost", "의문의 목소리", "......려 줘.."),
    d("voice-3", "balhaeGhost", "의문의 목소리", "알려줘.... 우리는 누구? 나는... 누구?"),
    d("voice-4", "balhaeGhost", "의문의 목소리", "찾아줘.... 찾아줘..."),
    showJeon,
    d("jeon-1", "jeon", "전", "윽... 머릿속을 울리는 이 목소리는 대체..?!"),
    d("jeon-2", "jeon", "전", "{{playerName}}, 괜찮습니까?!"),
    { id: "condition", type: "choice", prompt: "", advanceMode: "click", options: [
      { id: "okay", label: "괜찮다.", nextStepId: "forward-answer" },
      { id: "unsure", label: "모르겠다.", nextStepId: "unsure-answer-1" },
    ] },
    d("unsure-answer-1", "jeon", "전", "이런... 힘드시면, 베이스캠프에 잠시 돌아갔다가 들어와도 괜찮습니다."),
    d("forward-answer", "jeon", "전", "괜찮으시다면 우선 앞으로 나아가죠. 이 목소리가 어쩌면 힌트일지도 모르겠습니다."),
  ] }],
};

function clueStory(index: 1 | 2): StorySequence {
  const first = index === 1;
  return {
    id: `dungeon6-clue-${index}`, title: `발해의 단서 ${index}`, replayable: false, skippable: false, onCompleteScreen: "dungeon", backgrounds: {}, actors: { jeon, balhaeGhost: ghost },
    scenes: [{ id: `clue-${index}`, steps: [
      { id: "ghost-in", type: "illustOverlay", imageUrl: asset("balhae-refugee-spirit.png"), visible: true, fadeMs: 350, advanceMode: "auto" },
      d("ghost-line", "balhaeGhost", "발해 유민의 혼", first ? "나는... 누구..?" : "알려줘... 우리는... 누구....?"),
      { id: "ghost-out", type: "illustOverlay", visible: false, fadeMs: 350, advanceMode: "auto" },
      showJeon,
      d("jeon-see", "jeon", "전", first ? "방금 그건..?" : "이건.."),
      { id: "paper-in", type: "illustOverlay", imageUrl: asset("paper-fragment.png"), visible: true, fadeMs: 350, advanceMode: "auto" },
      d("paper-1", "jeon", "전", "아까 그 영혼이 사라지며 흘리고 간 것이군요."),
      ...(first ? [] : [d("paper-letter", "jeon", "전", "발해 왕이 직접 쓴 국서입니다.")]),
      d("paper-source", "jeon", "전", first ? "高句麗殘孼類聚。北依太白山下。國號渤海。" : "復高麗之舊居 有夫餘之遺俗"),
      d("paper-meaning", "jeon", "전", first
        ? "해석하면.. 고구려의 남은 무리들이 모여 살며 북쪽으로는 태백산 아래에 의지하여 나라 이름을 발해라 했다..라고 써져 있습니다."
        : "해석하면.. 고구려의 옛 터전을 회복하고 부여의 풍속을 이어받았다..라고 써져 있습니다.", "danger"),
      d("paper-take", "jeon", "전", "가지고 가죠. 어쩌면 이것이 단서일지도 모릅니다."),
      { id: "paper-out", type: "illustOverlay", visible: false, fadeMs: 250, advanceMode: "auto" },
    ] }],
  };
}

export const DUNGEON6_CLUE_STORIES = [clueStory(1), clueStory(2)] as const;

export const DUNGEON6_FINAL_STORY: StorySequence = {
  id: "dungeon6-final-story", title: "발해의 길 잃은 혼", replayable: false, skippable: false, onCompleteScreen: "dungeon", backgrounds: {}, actors: { jeon, balhaeGhost: ghost },
  scenes: [{ id: "final", steps: [
    { id: "lost-ghost-in", type: "illustOverlay", imageUrl: asset("lost-balhae-spirits.png"), visible: true, fadeMs: 350, advanceMode: "auto" },
    d("voice-1", "balhaeGhost", "의문의 목소리", "알려줘..."), d("voice-2", "balhaeGhost", "의문의 목소리", "찾아줘....."),
    d("voice-3", "balhaeGhost", "의문의 목소리", "나는.... 누구..?"), d("voice-4", "balhaeGhost", "의문의 목소리", "우리는.. 누...구...?"),
    showJeon,
    d("jeon-1", "jeon", "전", "...그렇군요. 다음 층으로 가는 길을 막고 있던 것은 길 잃은 발해 유민들의 혼이었습니다."),
    d("jeon-2", "jeon", "전", "그들은 이곳에서 자신의 정체에 대해 답을 구하고 있었던 것이군요."),
    d("jeon-3", "jeon", "전", "{{playerName}}, 우리가 모은 단서에 의하면 이제 그들의 정체를 알 수 있을 것 같습니다. 그들의 정체를 직접 말해주시겠어요?"),
    { id: "identity-choice", type: "choice", advanceMode: "click", options: [
      { id: "japan", label: "당신들은 일본의 후손이다.", nextStepId: "wrong" },
      { id: "baekje", label: "당신들은 백제의 후손이다.", nextStepId: "wrong" },
      { id: "goguryeo", label: "당신들은 고구려의 후손이다.", nextStepId: "correct-1" },
    ] },
    d("wrong", "jeon", "전", "이런, 다시 생각해보시겠어요?"),
    { id: "wrong-return", type: "choice", advanceMode: "click", options: [
      { id: "japan-again", label: "당신들은 일본의 후손이다.", nextStepId: "wrong" },
      { id: "baekje-again", label: "당신들은 백제의 후손이다.", nextStepId: "wrong" },
      { id: "goguryeo-again", label: "당신들은 고구려의 후손이다.", nextStepId: "correct-1" },
    ] },
    d("correct-1", "balhaeGhost", "의문의 목소리", "고구려...? 고구려...."), d("correct-2", "balhaeGhost", "의문의 목소리", "그래... 고구려.."),
    d("correct-3", "balhaeGhost", "의문의 목소리", "우리는.. 고구려의 대조영이 세운 땅.."), d("correct-4", "balhaeGhost", "의문의 목소리", "해동성국 발해의 사람이야..."),
    d("correct-5", "balhaeGhost", "의문의 목소리", "...고마워...."),
    { id: "lost-ghost-out", type: "illustOverlay", visible: false, fadeMs: 350, advanceMode: "auto" },
    d("ending-1", "jeon", "전", "{{playerName}}, 다음 층으로 가는 길이 열렸습니다."),
    d("ending-2", "jeon", "전", "어쩐지, 길을 헤매는 저들의 마음이 이해가 가는군요. 제 처지와 비슷해서 그런 것일까요."),
    d("ending-3", "jeon", "전", "...미안합니다. 이런 우울한 이야기를 하고 싶었던 것은 아닌데."),
    d("ending-4", "jeon", "전", "우선 베이스 캠프로 돌아갈까요? 모두에게 보고하고, 다음 계획을 세웁시다."),
  ] }],
};
