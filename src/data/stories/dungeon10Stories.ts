import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";

const actor = (id: "kaiden" | "luna" | "theo", name: string, role: string): StoryActor => ({
  id,
  name,
  role,
  portraits: {
    default: {
      imageUrl: NPC_PORTRAIT_REGISTRY[`${id}.default`],
      placeholder: { label: name, subtitle: role, gradient: "linear-gradient(135deg,#30291f,#111)" },
    },
  },
});

const actors = {
  kaiden: actor("kaiden", "카이든", "지휘관"),
  luna: actor("luna", "루나", "지형 분석가"),
  theo: actor("theo", "테오", "보급 담당"),
};

const dialogue = (id: string, speakerId: keyof typeof actors, text: string): StoryStep => ({
  id,
  type: "dialogue",
  speakerId,
  speakerName: actors[speakerId].name,
  activeActorId: speakerId,
  text,
  advanceMode: "click",
});

const show = (id: string, actorId: keyof typeof actors): StoryStep => ({
  id,
  type: "showPortrait",
  actorId,
  portraitId: "default",
  position: "left",
  transition: "fade",
  durationMs: 0,
  advanceMode: "auto",
});

export const DUNGEON10_ENTRY_STORY: StorySequence = {
  id: "dungeon10-entry-story",
  title: "던전 10층",
  replayable: false,
  skippable: false,
  onCompleteScreen: "dungeon",
  backgrounds: {},
  actors,
  scenes: [{
    id: "entry",
    steps: [
      show("show-theo", "theo"),
      dialogue("theo-1", "theo", "후.. 정말 어마어마한 기운이군요. 저 앞에 이 포탈의 원흉이 있는 것이 분명합니다."),
      show("show-luna", "luna"),
      dialogue("luna-1", "luna", " 원흉을 쓰러뜨려야 포탈을 소멸시키고 집으로 돌아갈 수 있어. 윽.. 정말 무섭지만, 해내야만 해! "),
      show("show-theo-2", "theo"),
      dialogue("theo-2", "theo", " 그렇습니다. 그리고, 공민왕을 위해서라도 우리는 꼭 해내야 합니다. "),
      show("show-luna-2", "luna"),
      dialogue("luna-2", "luna", " 응, 전 아저씨를 위해서라도.. "),
      show("show-kaiden", "kaiden"),
      dialogue("kaiden-1", "kaiden", " ... "),
      dialogue("kaiden-2", "kaiden", " 힘든 싸움이 될 것이다. "),
      dialogue("kaiden-3", "kaiden", " 준비가 되면 들어가자. "),
    ],
  }],
};
