import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";

const names = { luna: "루나", theo: "테오", kaiden: "카이든", jeon: "전" } as const;
const portraits = { luna: "happy", theo: "default", kaiden: "serious", jeon: "default" } as const;
const actor = (id: keyof typeof names): StoryActor => ({ id, name: names[id], portraits: { [portraits[id]]: { imageUrl: NPC_PORTRAIT_REGISTRY[`${id}.${portraits[id]}`] ?? NPC_PORTRAIT_REGISTRY[`${id}.default`], placeholder: { label: names[id], gradient: "#111" } } } });
const allIds = Object.keys(names) as Array<keyof typeof names>;
const say = (id: string, speaker: keyof typeof names, text: string): StoryStep[] => [
  ...allIds.map((actorId): StoryStep => ({ id: `${id}-hide-${actorId}`, type: "hidePortrait", actorId })),
  { id: `${id}-show`, type: "showPortrait", actorId: speaker, portraitId: portraits[speaker], position: "left", transition: "fade" },
  { id, type: "dialogue", speakerId: speaker, speakerName: names[speaker], activeActorId: speaker, text, advanceMode: "click" },
];
const actors = { luna: actor("luna"), theo: actor("theo"), kaiden: actor("kaiden"), jeon: actor("jeon") };

export const DUNGEON5_ENTRY_STORY: StorySequence = {
  id: "dungeon5-entry-story", title: "던전 5층", replayable: false, skippable: false, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "entry", steps: [
    ...say("entry-luna-1", "luna", "우왓?! 여기 뭐야?!"),
    ...say("entry-luna-2", "luna", "전쟁통이잖아!!"),
    ...say("entry-theo", "theo", "아무래도 이번 층에서는 고구려, 백제, 신라의 전쟁을 나타내는가 봅니다."),
    ...say("entry-kaiden", "kaiden", "조심해서 나아갈 필요가 있어보이는군."),
  ] }],
};

export const DUNGEON5_GATE_STORY: StorySequence = {
  id: "dungeon5-gate-story", title: "닫힌 입구", replayable: false, skippable: false, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "gate", steps: [
    { id: "gate-closed", type: "illustOverlay", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon5/gate-closed.png`, visible: true, fadeMs: 350, advanceMode: "auto" },
    ...say("gate-luna-1", "luna", "여기는..?"),
    ...say("gate-theo-1", "theo", "다음 층으로 가는 통로인가보군요."),
    ...say("gate-theo-2", "theo", "'삼국 통일의 과정에 대해 논하라' 라고 적혀있는 것을 보면 이 문제를 풀어야 길이 열리는 것 같습니다."),
    ...say("gate-luna-2", "luna", "음.. 삼국을 통일했던 나라는 분명.."),
    { id: "unification-choice", type: "choice", prompt: "삼국을 통일한 나라는?", advanceMode: "click", options: [
      { id: "goguryeo", label: "고구려였다.", nextStepId: "wrong-answer" }, { id: "baekje", label: "백제였다.", nextStepId: "wrong-answer" }, { id: "silla", label: "신라였다.", nextStepId: "right-answer" },
    ] },
    ...say("wrong-answer", "kaiden", "아니, 신라였지."),
    { id: "wrong-jump", type: "checkpoint", checkpointId: "answer-resolved", advanceMode: "auto" },
    ...say("right-answer", "kaiden", "그래. 신라였지."),
    ...say("reason-kaiden", "kaiden", "신라가 삼국을 통일할 수 있었던 이유에 대해 말하라는 것인가.."),
    ...say("reason-luna", "luna", "나는 전투에 능한 고구려가 이길 줄 알았는데.. 어떻게 신라가 통일한 거지?"),
    { id: "reason-choice", type: "choice", advanceMode: "click", options: [
      { id: "alliance", label: "동맹을 맺었을 것이다." }, { id: "trick", label: "속임수를 썼을 것이다." },
    ] },
    ...say("jeon-alliance-1", "jeon", "아마 동맹을 맺었을 겁니다."),
    ...say("jeon-alliance-2", "jeon", "그 시기에 동맹을 맺을 나라라면 당나라였겠군요."),
    ...say("jeon-alliance-3", "jeon", "외부의 힘을 빌려 고구려를 무너뜨리고 통일을 이루었겠지요."),
    ...say("kaiden-agree", "kaiden", "맞는 말이군."),
    ...say("kaiden-question", "kaiden", "하지만 당나라는 왜 신라를 도왔던 거지?"),
    ...say("jeon-trade-1", "jeon", "거래를 했을 겁니다."),
    ...say("jeon-trade-2", "jeon", "땅을 일부 넘겨주는 조건이었겠지요."),
    ...say("jeon-trade-3", "jeon", "그러니 완벽한 통일이라기보다는, 분명 한계도 있었을 겁니다."),
    ...say("luna-smart", "luna", "우와... 전 아저씨, 진짜 똑똑하네요. 기억이 돌아온 거예요?"),
    ...say("jeon-learning", "jeon", "기억은 나지 않지만 제왕학에서는 기본으로 배우는 것이니 알 수밖에요."),
    ...say("theo-thought", "theo", "(제왕학...?)"),
    { id: "gate-shake", type: "shake", durationMs: 1000, amplitude: 12, advanceMode: "auto" },
    { id: "gate-fade", type: "fade", direction: "out", color: "#000", durationMs: 350, advanceMode: "auto" },
    { id: "gate-open", type: "illustOverlay", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon5/gate-open.png`, visible: true, fadeMs: 350, advanceMode: "auto" },
    { id: "gate-fade-in", type: "fade", direction: "in", color: "#000", durationMs: 350, advanceMode: "auto" },
    ...say("kaiden-open", "kaiden", "...입구가 열렸다."),
    ...say("theo-return", "theo", "베이스캠프로 돌아가 다음 계획을 세우죠."),
  ] }],
};
