import { useMemo } from "react";
import { StoryPlayer } from "../game/story/StoryPlayer";
import { NPC_PORTRAIT_REGISTRY } from "../game/npc/npcPortraitRegistry";
import type { StorySequence, StoryStep } from "../types/story";

const show = (actorId: "kaiden" | "theo" | "luna"): StoryStep => ({ id: `show-${actorId}`, type: "showPortrait", actorId, portraitId: actorId === "luna" ? "happy" : actorId === "kaiden" ? "serious" : "default", position: "left", transition: "fade" });
const line = (id: string, actorId: "kaiden" | "theo" | "luna", speakerName: string, text: string): StoryStep => ({ id, type: "dialogue", speakerId: actorId, speakerName, activeActorId: actorId, text, advanceMode: "click" });

export function PrehistoryCompletionStory({ playerName, onComplete }: { playerName: string; onComplete: () => void }) {
  const sequence = useMemo<StorySequence>(() => ({
    id: "floor-1-prehistory-completion", title: "던전 1층 조사 완료", replayable: false,
    skippable: false, onCompleteScreen: "baseCamp", backgrounds: {},
    actors: Object.fromEntries((["kaiden", "theo", "luna"] as const).map((id) => {
      const portraitId = id === "luna" ? "happy" : id === "kaiden" ? "serious" : "default";
      const name = id === "kaiden" ? "카이든" : id === "theo" ? "테오" : "루나";
      return [id, { id, name, portraits: { [portraitId]: {
        imageUrl: NPC_PORTRAIT_REGISTRY[`${id}.${portraitId}`] ?? NPC_PORTRAIT_REGISTRY[`${id}.default`],
        placeholder: { label: name, gradient: "linear-gradient(135deg, #30291f, #111)" },
      } } }];
    })),
    scenes: [{ id: "completion", steps: [
      show("kaiden"), line("k1", "kaiden", "카이든", `${playerName || "플레이어"}. 돌아왔군. 그것은..?`),
      show("theo"), line("t1", "theo", "테오", "주먹도끼, 슴베찌르개, 그리고 빗살무늬 토기군요."), line("t2", "theo", "테오", "그것들은 전부..."),
      show("kaiden"), line("k2", "kaiden", "카이든", "선사시대의 유물이지."),
      show("luna"), line("l1", "luna", "루나", "이제 알겠어."), line("l2", "luna", "루나", "대장."), line("l3", "luna", "루나", "이 던전은 한반도의 역사와 관련 있는게 분명해."), line("l4", "luna", "루나", "이 던전을 빠져나갈 방법도 한반도 역사와 관련이 있을거야."),
      show("kaiden"), line("k3", "kaiden", "카이든", "그래."), line("k4", "kaiden", "카이든", "일리가 있군."), line("k5", "kaiden", "카이든", "우선 나아가지."), line("k6", "kaiden", "카이든", "이 다음에 무엇이 있을지 모르니 신중하도록."),
    ] }],
  }), [playerName]);
  return <div className="base-camp-story-overlay"><StoryPlayer sequence={sequence} playerName={playerName} onNavigate={() => undefined} onComplete={onComplete} presentationMode="baseCampOverlay" /></div>;
}
