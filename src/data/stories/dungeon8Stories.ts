import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon8/${name}`;
const ACTOR_IDS = ["luna", "kaiden", "theo", "jeon"] as const;

function actor(id: typeof ACTOR_IDS[number], name: string, role: string): StoryActor {
  return {
    id,
    name,
    role,
    portraits: {
      default: {
        imageUrl: NPC_PORTRAIT_REGISTRY[`${id}.default`],
        placeholder: { label: name, subtitle: role, gradient: "linear-gradient(135deg,#30291f,#111)" },
      },
    },
  };
}

const actors = {
  luna: actor("luna", "루나", "지형 분석가"),
  kaiden: actor("kaiden", "카이든", "지휘관"),
  theo: actor("theo", "테오", "보급 담당"),
  jeon: actor("jeon", "전", "기억을 잃은 남자"),
};

function speak(
  id: string,
  actorId: typeof ACTOR_IDS[number],
  speakerName: string,
  text: string,
  options: { nextStepId?: string } = {},
): StoryStep[] {
  return [
    ...ACTOR_IDS.map((idToHide): StoryStep => ({ id: `${id}-hide-${idToHide}`, type: "hidePortrait", actorId: idToHide, durationMs: 0 })),
    { id: `${id}-show`, type: "showPortrait", actorId, portraitId: "default", position: "left", transition: "fade", durationMs: 0 },
    { id, type: "dialogue", speakerId: actorId, speakerName, activeActorId: actorId, text, ...options, advanceMode: "click" },
  ];
}

const hideAll = (id: string): StoryStep[] => ACTOR_IDS.map((actorId): StoryStep => ({
  id: `${id}-${actorId}`,
  type: "hidePortrait",
  actorId,
  durationMs: 0,
}));

const historyOptions = (prefix: string, correct: string, correctTarget: string, wrongTarget: string) => [
  { id: `${prefix}-seo-hui`, label: "서희다.", nextStepId: correct === "서희다." ? correctTarget : wrongTarget },
  { id: `${prefix}-gang-gam-chan`, label: "강감찬이다.", nextStepId: correct === "강감찬이다." ? correctTarget : wrongTarget },
  { id: `${prefix}-yun-gwan`, label: "윤관이다.", nextStepId: correct === "윤관이다." ? correctTarget : wrongTarget },
  { id: `${prefix}-sambyeolcho`, label: "삼별초다.", nextStepId: correct === "삼별초다." ? correctTarget : wrongTarget },
];

export const DUNGEON8_FINAL_STORY: StorySequence = {
  id: "dungeon8-final-story",
  title: "고려와 주변 국가의 관계",
  replayable: false,
  skippable: false,
  onCompleteScreen: "dungeon",
  backgrounds: {},
  actors,
  scenes: [{
    id: "dungeon8-final",
    steps: [
      ...speak("luna-empty-room", "luna", "루나", " ..이게 뭐야!? 아무것도 없잖아!! 벌써 마지막 방인데, 아무 것도 못찾았어! "),
      ...speak("kaiden-look", "kaiden", "카이든", " ...아니다. 앞을 봐. "),
      { id: "stela-before-in", type: "illustOverlay", imageUrl: asset("goryeo-stela-before.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "stela-before-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      ...speak("kaiden-key", "kaiden", "카이든", " 어쩌면 이것이 이번 층의 열쇠일지도 모르겠군. "),
      ...speak("theo-first", "theo", "테오", " 이것은... 어딘가 익숙한 모습들이군요. 가장 왼쪽은.. 거란 장수 소손녕과 외교 담판을 벌이는 장면인가 봅니다. 이 벽화 속의 인물은.. "),
      { id: "q1-choice", type: "choice", advanceMode: "click", options: historyOptions("q1", "서희다.", "q1-correct-hide-luna", "q1-wrong-hide-luna") },
      ...speak("q1-wrong", "luna", "루나", " ...? 그런가? 아니었던 것 같은데? "),
      { id: "q1-retry", type: "choice", advanceMode: "click", options: historyOptions("q1-retry", "서희다.", "q1-correct-hide-luna", "q1-wrong-hide-luna") },
      ...speak("q1-correct", "theo", "테오", "그렇습니다. 서희가 거란 장수와의 외교담판 끝에 강동 6주를 확보했었죠."),
      ...speak("q2-intro", "kaiden", "카이든", " 그리고 두 번째는.. 말을 탄 장군의 모습이군. 귀주에서 거란을 크게 무찔렀었지. "),
      { id: "q2-choice", type: "choice", advanceMode: "click", options: historyOptions("q2", "강감찬이다.", "q2-correct-hide-luna", "q2-wrong-hide-luna") },
      ...speak("q2-wrong", "kaiden", "카이든", " 흠... 다시 한 번 생각해 봐. "),
      { id: "q2-retry", type: "choice", advanceMode: "click", options: historyOptions("q2-retry", "강감찬이다.", "q2-correct-hide-luna", "q2-wrong-hide-luna") },
      ...speak("q2-correct", "kaiden", "카이든", " 맞아. 역시나군, (플레이어 이름). "),
      ...speak("q3-intro", "theo", "테오", " 세 번째는.. 군대의 모습이군요. 이 시기라면 아마 별무반이겠지요. 이것을 조직한 사람은.. "),
      { id: "q3-choice", type: "choice", advanceMode: "click", options: historyOptions("q3", "윤관이다.", "q3-correct-hide-luna", "q3-wrong-hide-luna") },
      ...speak("q3-wrong", "luna", "루나", " 다시 생각해봐, (플레이어이름)! "),
      { id: "q3-retry", type: "choice", advanceMode: "click", options: historyOptions("q3-retry", "윤관이다.", "q3-correct-hide-luna", "q3-wrong-hide-luna") },
      ...speak("q3-correct", "theo", "테오", "맞습니다. 윤관이 별무반이라는 이름의 군대를 조직하여 여진족을 무찔렀습니다. "),
      ...speak("theo-meaning", "theo", "테오", " 그런데.. 이것들이 무엇을 의미하는 걸까요? "),
      ...speak("luna-empty-frame", "luna", "루나", " 가장 오른쪽을 봐.. 저기 저 비어있는 곳이 수상해. "),
      ...speak("theo-what", "theo", "테오", " 무엇이 말입니까? "),
      ...speak("luna-missing-one", "luna", "루나", " 마치, 그림 한 개가 더 있었는데 지워진 것처럼 생겼잖아. 어쩌면 우리가 놓친 인물이 한 명 더 있는 거야. "),
      ...speak("theo-forgotten", "theo", "테오", " 우리가 잊어버린 인물이 있다는 뜻입니까? "),
      ...speak("luna-important", "luna", "루나", " 아마도. 아주 중요한 인물 말이야. "),
      ...speak("kaiden-return", "kaiden", "카이든", " ...어쩔 수 없군, 베이스캠프로 돌아가서 그 인물에 대해 더 상의해봐야할 것 같다. "),
      ...speak("theo-return", "theo", "테오", " 알겠습니다, 대장. 그럼 속히 베이스캠프로 돌아가지요. "),
      ...speak("jeon-no", "jeon", "전", " 아니오. 돌아가지 않아도 괜찮습니다.. "),
      ...speak("luna-jeon", "luna", "루나", " 전 아저씨?! 언제 따라온거야! "),
      ...speak("jeon-identity", "jeon", "전", " ..하하. 줄곧 제가 누구인지가 궁금했습니다. "),
      ...speak("jeon-called", "jeon", "전", " 머리가 아파 잠시 잠을 청했다가 일어났는데.. 이곳이 저를 부르는 느낌을 받았어요. "),
      ...speak("jeon-sorry", "jeon", "전", " 베이스캠프에 남으라는 명을 어겨 미안합니다, 카이든 대장. "),
      ...speak("kaiden-okay", "kaiden", "카이든", " ...괜찮다. "),
      ...speak("jeon-butter", "jeon", "전", " 우리 할 말이 아주 많이 남았지요. 루나가 말한 버터떡이라는 것도 밖에 나가면 꼭 먹어보고 싶었는데.. "),
      ...speak("jeon-goodbye", "jeon", "전", " 아쉽지만 헤어져야 할 때군요. "),
      ...speak("luna-goodbye", "luna", "루나", " 전 아저씨.. 그게 무슨 말이야? 헤어져야 한다니.. 여기서? "),
      ...speak("jeon-full", "jeon", "전", " 당신들과 함께 여러 역사를 바로잡으면서, 마음이 충만해지는 느낌이 들었습니다. "),
      ...speak("jeon-zeal", "jeon", "전", " 신기하게도.. 마음이 충만해질 수록, 어떤 열의 또한 품게되었지요. "),
      ...speak("jeon-confused", "jeon", "전", " 그 열의가 무엇이었는지, 저도 정확히 이름 붙일 수 없었습니다.. 그저 혼란스러울 뿐이었지요. "),
      ...speak("jeon-realized", "jeon", "전", " 그리고 바로 얼마 전, 당신들을 뒤따라오기 전에 깨달은 것입니다. 제 열의는.. "),
      ...speak("jeon-mission", "jeon", "전", " <red><b>제 나라, 고려를 바로잡아야 한다는 사명감이었습니다.</b></red> "),
      ...speak("theo-realize", "theo", "테오", " ...! "),
      ...speak("kaiden-knew", "kaiden", "카이든", " 역시, 당신은.. "),
      ...speak("wangjeon-mongol", "jeon", "왕전", " 몽골의 침략을 받은 후.. 고려는 몽골의 영향을 너무 많이 받고 있어요. 고려의 독자적인 힘을 키워나가야합니다. "),
      ...speak("wangjeon-name", "jeon", "왕전", " 그래요. 제 이름은 왕전. 몽골에서 벗어나 우리만의 힘을 키워나갈.. 고려의 국왕입니다. "),
      ...speak("theo-king", "theo", "테오", "왕전... 그렇다면 당신은, 고려의 31대 국왕인.. "),
      ...speak("wangjeon-silence", "jeon", "왕전", " ... "),
      ...speak("wangjeon-time", "jeon", "왕전", " 정말로 헤어질 시간이로군요. "),
      ...hideAll("before-disappear-hide"),
      { id: "stela-before-disappear-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "disappear-start-in", type: "illustOverlay", imageUrl: asset("jeon-disappear-start.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "disappear-start-wait", type: "wait", durationMs: 1000, advanceMode: "auto" },
      ...speak("wangjeon-trip", "jeon", "왕전", "여러분과 함께 한 여행은 정말 즐거웠습니다. "),
      ...speak("wangjeon-history", "jeon", "왕전", " 삼국시대부터 이때까지.. 짧은 여행이었지만, 덕분에 무엇을 해야 하는지 깨달았어요. "),
      ...hideAll("reaching-hide"),
      { id: "reaching", type: "narration", text: "왕전의 몸이 밝게 빛나더니 이내 조금씩 사라져 간다.\n당신은 왕전에게 손을 뻗었다.\n그러자 왕전도 아쉬운 듯 손을 뻗어주었다.", advanceMode: "click" },
      { id: "start-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "middle-in", type: "illustOverlay", imageUrl: asset("jeon-disappear-middle.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "middle-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      { id: "fading-narration", type: "narration", text: "왕전의 모습이 점점 사라져간다.", advanceMode: "click" },
      { id: "farewell-choice", type: "choice", advanceMode: "click", options: [
        { id: "ask-where", label: "어디로 가나요?", nextStepId: "where-response-hide-luna" },
        { id: "ask-stay", label: "가지 마세요.", nextStepId: "stay-response-hide-luna" },
      ] },
      ...speak("where-response", "jeon", "왕전", " 제가 있어야 할 곳, 올바른 역사 속으로요. ", { nextStepId: "farewell-duty-hide-luna" }),
      ...speak("stay-response", "jeon", "왕전", " 이런, (플레이어 이름). 아쉬워 마십시오. 제가 있어야 할 곳으로 돌아갈 뿐입니다. "),
      ...speak("farewell-duty", "jeon", "왕전", " 돌아가서, 제가 해야 할 일을 하겠습니다. "),
      ...speak("farewell-thanks", "jeon", "왕전", " 여러분, 정말 감사했습니다. "),
      ...hideAll("final-fade-hide"),
      { id: "middle-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "end-in", type: "illustOverlay", imageUrl: asset("jeon-disappear-end.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "end-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      ...speak("luna-sad", "luna", "루나", " 전 아저씨..! 이제 겨우 친해졌는데.. "),
      ...speak("theo-silence", "theo", "테오", " ... "),
      { id: "end-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "stela-before-return", type: "illustOverlay", imageUrl: asset("goryeo-stela-before.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "stela-return-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      ...speak("kaiden-filled", "kaiden", "카이든", " ...비어있던 그림이 채워진다. "),
      { id: "stela-switch-wait", type: "wait", durationMs: 500, advanceMode: "auto" },
      { id: "stela-before-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "stela-after-in", type: "illustOverlay", imageUrl: asset("goryeo-stela-after.png"), visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: "stela-after-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
      ...speak("theo-history", "theo", "테오", " 전은.. 정말 역사 속의 인물이었군요.. "),
      ...speak("theo-gongmin", "theo", "테오", " 그의 이름이 왕전이었다니.. 우리에게는 '공민왕'이라는 이름이 더 익숙하지만요. "),
      ...speak("kaiden-gongmin", "kaiden", "카이든", " 그래. 공민왕은 몽골의 영향을 줄이고 고려만의 힘을 키우려고 노력했던 왕이지. "),
      ...speak("kaiden-open", "kaiden", "카이든", " 비석 속 마지막 인물은 공민왕이었군.. 덕분에 다음 층으로 가는 길이 열렸다. "),
      ...speak("luna-happy", "luna", "루나", " 전 아저씨가 행복했으면 좋겠어 "),
      ...speak("luna-gongmin", "luna", "루나", " 아니, 이제는 공민왕 아저씨지. "),
      ...speak("theo-basecamp", "theo", "테오", " ...우선 베이스캠프로 돌아갑시다. "),
      ...speak("theo-careful", "theo", "테오", " 공민왕께서 열어준 길이니, 더욱 신중하게 나아갑시다. "),
      { id: "stela-after-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    ],
  }],
};
