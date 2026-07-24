import type { StorySequence } from "../../types/story";

export const TEST_STORY_SEQUENCE: StorySequence = {
  id: "forest-introduction-test",
  title: "숲에서 만난 사람들",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {
    forest: {
      placeholder: {
        label: "깊은 숲",
        subtitle: "테스트용 CSS 배경",
        gradient:
          "radial-gradient(circle at 72% 22%, rgba(225, 238, 169, 0.28), transparent 17%), linear-gradient(155deg, #112a26 0%, #244a35 48%, #14231f 100%)",
      },
    },
  },
  actors: {
    guide: {
      id: "guide",
      name: "안내자",
      role: "모험 안내자",
      portraits: {
        neutral: {
          placeholder: {
            label: "안내자",
            subtitle: "기본 표정",
            gradient: "linear-gradient(145deg, #7d6848, #394c55)",
          },
        },
        happy: {
          placeholder: {
            label: "안내자",
            subtitle: "기쁨 표정",
            gradient: "linear-gradient(145deg, #ad814a, #466b62)",
          },
        },
      },
    },
    villager: {
      id: "villager",
      name: "주민",
      role: "숲 인근 주민",
      portraits: {
        worried: {
          placeholder: {
            label: "주민",
            subtitle: "걱정 표정",
            gradient: "linear-gradient(145deg, #6f637d, #35404f)",
          },
        },
      },
    },
  },
  scenes: [
    {
      id: "forest-opening",
      steps: [
        {
          id: "show-forest",
          type: "setBackground",
          backgroundId: "forest",
          transition: "fade",
          durationMs: 500,
          advanceMode: "auto",
        },
        {
          id: "show-guide",
          type: "showPortrait",
          actorId: "guide",
          portraitId: "neutral",
          position: "right",
          transition: "slideRight",
          durationMs: 320,
          advanceMode: "auto",
        },
        {
          id: "guide-neutral-line",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "이 숲을 지나면 어드벤처 아카데미의 베이스캠프가 나와. 길을 잃지 않도록 내가 안내할게.",
          advanceMode: "click",
        },
        {
          id: "guide-happy",
          type: "changePortrait",
          actorId: "guide",
          portraitId: "happy",
          durationMs: 220,
          advanceMode: "auto",
        },
        {
          id: "show-villager",
          type: "showPortrait",
          actorId: "villager",
          portraitId: "worried",
          position: "left",
          transition: "slideLeft",
          durationMs: 320,
          advanceMode: "auto",
        },
        {
          id: "villager-worried-line",
          type: "dialogue",
          speakerId: "villager",
          speakerName: "주민",
          activeActorId: "villager",
          text: "마침 잘 왔어요. 숲 안쪽에서 이상한 기척이 느껴져 모두 걱정하고 있었답니다.",
          advanceMode: "click",
        },
        {
          id: "forest-narration",
          type: "narration",
          text: "나뭇잎 사이로 불어온 바람이, 새로운 모험의 시작을 알렸다.",
          advanceMode: "click",
        },
        {
          id: "fade-to-camp",
          type: "fade",
          direction: "out",
          color: "#080b0d",
          durationMs: 600,
          advanceMode: "auto",
        },
        {
          id: "go-to-base-camp",
          type: "changeScreen",
          screen: "baseCamp",
          advanceMode: "auto",
        },
      ],
    },
  ],
};
