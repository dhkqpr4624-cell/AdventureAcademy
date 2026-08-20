import type { ScreenId } from "../app/routes";

export type StoryPortraitPosition = "left" | "right";
export type StoryTransition = "none" | "fade" | "slideLeft" | "slideRight";
export type StoryFacing = "Left" | "Right";
export type StoryNpcPose = "Standing" | "Walking" | "FallDown";

export type StoryVisualAsset = {
  imageUrl?: string;
  layers?: {
    id: string;
    imageUrl: string;
    order: number;
  }[];
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
  accentColor?: string;
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
      emphasis?: "danger" | "info";
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
      type: "choice";
      prompt?: string;
      options: StoryChoiceOption[];
      advanceMode: "click";
    }
  | {
      id: string;
      type: "checkpoint";
      checkpointId: string;
      advanceMode: "auto";
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
      type: "cameraPan";
      x: number;
      y: number;
      zoom?: number;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "cameraZoom";
      zoom: number;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "shake";
      durationMs: number;
      amplitude: number;
      hideDialogue?: boolean;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "npcWalk";
      actorId: string;
      fromX?: number;
      toX: number;
      y?: number;
      facing: StoryFacing;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "npcPose";
      actorId: string;
      pose: Exclude<StoryNpcPose, "Walking">;
      facing?: StoryFacing;
      x?: number;
      y?: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "illustOverlay";
      imageUrl?: string;
      visible: boolean;
      fadeMs?: number;
      hideDialogue?: boolean;
      waitForFade?: boolean;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "showBaseCamp";
      mapId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "focusBaseCamp";
      focusPointId: string;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "highlightBaseCampTarget";
      targetId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "clearBaseCampHighlight";
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "restoreBaseCampCamera";
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "changeScreen";
      screen: ScreenId;
      advanceMode: "auto";
    };

export type StoryChoiceOption = {
  id: string;
  label: string;
  nextStepId?: string;
  closeStory?: boolean;
  actionId?: string;
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
      emphasis?: "danger" | "info";
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
  baseCampMapId: string | null;
  fade: {
    visible: boolean;
    color: string;
    durationMs: number;
  };
  camera: {
    x: number;
    y: number;
    zoom: number;
    durationMs: number;
    shakeDurationMs: number;
    shakeAmplitude: number;
    shakeRevision: number;
  };
  storyNpcs: Record<string, {
    actorId: string;
    pose: StoryNpcPose;
    facing: StoryFacing;
    x: number;
    y: number;
    durationMs: number;
  }>;
  illust: {
    imageUrl: string | null;
    visible: boolean;
    fadeMs: number;
  };
};

export type IntroTextScene = {
  id: string;
  mode: "introText";
  lines: string[];
};

export type StoryPlayerScene = {
  id: string;
  mode: "story";
  sequence: StorySequence;
};

export type IntroScene = IntroTextScene | StoryPlayerScene;

export type IntroSceneSequence = {
  id: string;
  scenes: IntroScene[];
  onCompleteScreen: ScreenId;
};
