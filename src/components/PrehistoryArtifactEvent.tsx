import { useMemo } from "react";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { StorySequence } from "../types/story";

export type PrehistoryArtifactId = "hand-axe" | "tanged-point" | "comb-pattern-pottery";

const DATA: Record<PrehistoryArtifactId, { name: string; title: string }> = {
  "hand-axe": { name: "주먹도끼", title: "주먹도끼 발견" },
  "tanged-point": { name: "슴베찌르개", title: "슴베찌르개 발견" },
  "comb-pattern-pottery": { name: "빗살무늬 토기", title: "빗살무늬 토기 발견" },
};

export function PrehistoryArtifactEvent({ artifactId, imageUrl, onComplete }: {
  artifactId: PrehistoryArtifactId;
  imageUrl: string;
  onComplete: () => void;
}) {
  const artifact = DATA[artifactId];
  const sequence = useMemo<StorySequence>(() => ({
    id: `floor-1-${artifactId}-found`, title: artifact.title, replayable: false,
    skippable: false, onCompleteScreen: "dungeon", backgrounds: {}, actors: {},
    scenes: [{ id: `floor-1-${artifactId}-scene`, steps: [
      { id: "line-1", type: "narration", text: "이것은..?", advanceMode: "click" },
      { id: "line-2", type: "narration", text: `${artifact.name}를 주웠다.`, advanceMode: "click" },
      { id: "line-3", type: "narration", text: "카이든에게 보여주는 것이 좋을 것 같다.", advanceMode: "click" },
      { id: "line-4", type: "narration", text: "카이든에게 가져가서 보여주자.", advanceMode: "click" },
    ] }],
  }), [artifact.name, artifact.title, artifactId]);
  return <>
    <div className="dungeon-room-event-image"><img className="is-revealing" src={imageUrl} alt={artifact.title} /></div>
    <div className="base-camp-story-overlay"><StoryPlayer sequence={sequence} onNavigate={() => undefined} onComplete={onComplete} presentationMode="baseCampOverlay" /></div>
  </>;
}
