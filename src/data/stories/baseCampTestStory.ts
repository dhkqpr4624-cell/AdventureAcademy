import type { StorySequence } from "../../types/story";

export const BASE_CAMP_TEST_STORY_SEQUENCE: StorySequence = {
  id: "base-camp-camera-test",
  title: "베이스캠프 연출 개발 테스트",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    guide: {
      id: "guide",
      name: "안내자",
      role: "모험 안내자",
      portraits: {},
    },
  },
  scenes: [
    {
      id: "base-camp-tour",
      steps: [
        {
          id: "show-base-camp",
          type: "showBaseCamp",
          mapId: "academy-base-camp",
          advanceMode: "auto",
        },
        {
          id: "focus-shop",
          type: "focusBaseCamp",
          focusPointId: "shop",
          durationMs: 1000,
          advanceMode: "auto",
        },
        {
          id: "highlight-shop",
          type: "highlightBaseCampTarget",
          targetId: "shop",
          advanceMode: "auto",
        },
        {
          id: "shop-guide-line",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "이곳에서는 모험에 필요한 물건을 구할 수 있어.",
          advanceMode: "click",
        },
        {
          id: "clear-shop-highlight",
          type: "clearBaseCampHighlight",
          advanceMode: "auto",
        },
        {
          id: "focus-dungeon-entrance",
          type: "focusBaseCamp",
          focusPointId: "dungeonEntrance",
          durationMs: 1000,
          advanceMode: "auto",
        },
        {
          id: "highlight-dungeon-entrance",
          type: "highlightBaseCampTarget",
          targetId: "dungeonEntrance",
          advanceMode: "auto",
        },
        {
          id: "dungeon-guide-line",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "퀘스트를 받으면 저 입구에서 새로운 층으로 들어갈 수 있어.",
          advanceMode: "click",
        },
        {
          id: "clear-dungeon-highlight",
          type: "clearBaseCampHighlight",
          advanceMode: "auto",
        },
        {
          id: "restore-base-camp-camera",
          type: "restoreBaseCampCamera",
          durationMs: 750,
          advanceMode: "auto",
        },
        {
          id: "return-to-base-camp",
          type: "changeScreen",
          screen: "baseCamp",
          advanceMode: "auto",
        },
      ],
    },
  ],
};
