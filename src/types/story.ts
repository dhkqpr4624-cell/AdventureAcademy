import type { ScreenId } from "../app/routes";

export type StoryPortraitPosition = "left" | "right";
export type StoryTransition = "none" | "fade" | "slideLeft" | "slideRight";

export type StoryVisualAsset = {
  imageUrl?: string;
  placeholder: {
    label: string;
    subtitle?: string;
    gradient: string;
  };
};

export type StoryActor = {
  id: string;
  name: string;
  role?: string;
  portraits: Record<string, StoryVisualAsset>;
};

type AutoStoryStep = {
  id: string;
  advanceMode?: "auto";
  durationMs?: number;
};

export type StoryStep =
  | (AutoStoryStep & {
      type: "setBackground";
      backgroundId: string;
      transition?: StoryTransition;
    })
  | (AutoStoryStep & {
      type: "showPortrait";
      actorId: string;
      portraitId: string;
      position: StoryPortraitPosition;
      transition?: StoryTransition;
    })
  | (AutoStoryStep & {
      type: "changePortrait";
      actorId: string;
      portraitId: string;
    })
  | (AutoStoryStep & {
      type: "hidePortrait";
      actorId: string;
    })
  | {
      id: string;
      type: "dialogue";
      speakerId?: string;
      speakerName: string;
      activeActorId?: string;
      text: string;
      advanceMode: "click";
    }
  | {
      id: string;
      type: "narration";
      text: string;
      advanceMode: "click";
    }
  | {
      id: string;
      type: "wait";
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "fade";
      direction: "in" | "out";
      color?: string;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "changeScreen";
      screen: ScreenId;
      advanceMode: "auto";
    };

export type StoryScene = {
  id: string;
  steps: StoryStep[];
};

export type StorySequence = {
  id: string;
  title: string;
  scenes: StoryScene[];
  backgrounds: Record<string, StoryVisualAsset>;
  actors: Record<string, StoryActor>;
  replayable: boolean;
  skippable: boolean;
  onCompleteScreen: ScreenId;
};

export type StoryDialogueState =
  | {
      kind: "dialogue";
      speakerName: string;
      text: string;
      activeActorId?: string;
    }
  | {
      kind: "narration";
      text: string;
    }
  | null;

export type VisibleStoryPortrait = {
  actorId: string;
  portraitId: string;
  position: StoryPortraitPosition;
  transition: StoryTransition;
  revision: number;
};

export type StoryRenderState = {
  backgroundId: string | null;
  backgroundTransition: StoryTransition;
  backgroundRevision: number;
  portraits: Record<string, VisibleStoryPortrait>;
  dialogue: StoryDialogueState;
  fade: {
    visible: boolean;
    color: string;
    durationMs: number;
  };
};
