import { useEffect, useMemo, useState } from "react";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { StoryActor, StorySequence, StoryStep } from "../types/story";

type Phase = "prison" | "prisonFade" | "black" | "found" | "intro" | "pause" | "reveal";

const prisonUrl = `${import.meta.env.BASE_URL}assets/story/dungeon4/gaya-prison-entrance.png`;
const foundUrl = `${import.meta.env.BASE_URL}assets/story/dungeon4/jeon-found.png`;
const portraitUrl = `${import.meta.env.BASE_URL}assets/story/portraits/jeon.png`;

function jeonActor(name: string): StoryActor {
  return {
    id: "jeon",
    name,
    role: "기억을 잃은 남자",
    portraits: {
      default: {
        imageUrl: portraitUrl,
        placeholder: { label: name, subtitle: "기억을 잃은 남자", gradient: "linear-gradient(135deg, #241b1c, #080707)" },
      },
    },
  };
}

function makeSequence(id: string, title: string, actorName: string, steps: StoryStep[]): StorySequence {
  return {
    id,
    title,
    replayable: false,
    skippable: false,
    onCompleteScreen: "baseCamp",
    backgrounds: {},
    actors: { jeon: jeonActor(actorName) },
    scenes: [{ id: `${id}-scene`, steps }],
  };
}

export function JeonDiscoveryStory({
  playerName,
  onComplete,
}: {
  playerName: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("prison");

  const prisonSequence = useMemo(() => makeSequence("floor-4-prison-entry", "가야의 감옥", "???", [
    { id: "prison-1", type: "dialogue", speakerName: "", text: "이 곳은..?", advanceMode: "click" },
    { id: "prison-2", type: "dialogue", speakerName: "", text: "철을 주로 사용하고 있는 감옥이다.\n아마 가야의 감옥인 듯하다.", advanceMode: "click" },
    { id: "prison-3", type: "dialogue", speakerName: "", text: "이상하게도,\n어느 한 곳만 감옥 문이 부숴져 있는 듯하다.", advanceMode: "click" },
    { id: "prison-4", type: "dialogue", speakerName: "", text: "부숴진 감옥으로 다가가 보자.", advanceMode: "click" },
  ]), []);

  const introSequence = useMemo(() => makeSequence("floor-4-jeon-intro", "수상한 사람", "???", [
    { id: "show-jeon", type: "showPortrait", actorId: "jeon", portraitId: "default", position: "left", transition: "fade" },
    { id: "jeon-question", type: "dialogue", speakerId: "jeon", speakerName: "???", activeActorId: "jeon", text: "당신은..\n누구시오?", advanceMode: "click" },
    { id: "name-choice", type: "choice", prompt: "", advanceMode: "click", options: [{ id: "tell-name", label: "이름을 말해준다." }] },
    { id: "jeon-name", type: "dialogue", speakerId: "jeon", speakerName: "???", activeActorId: "jeon", text: `그래,\n${playerName}\n(이)라고 하는군...`, advanceMode: "click" },
    { id: "identity-choice", type: "choice", prompt: "", advanceMode: "click", options: [{ id: "ask-identity", label: "당신은 누구시죠?" }] },
    { id: "jeon-hesitate", type: "dialogue", speakerId: "jeon", speakerName: "???", activeActorId: "jeon", text: "나는...\n내 이름은...", advanceMode: "click" },
  ]), [playerName]);

  const revealSequence = useMemo(() => makeSequence("floor-4-jeon-reveal", "전", "전", [
    { id: "show-jeon", type: "showPortrait", actorId: "jeon", portraitId: "default", position: "left", transition: "fade" },
    { id: "jeon-memory", type: "dialogue", speakerId: "jeon", speakerName: "???", activeActorId: "jeon", text: "사실\n기억이 잘 나지 않습니다..", advanceMode: "click" },
    { id: "jeon-name-reveal", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "유일하게 기억나는 것은..\n\n'전'\n\n이라는 이름뿐이지요.", advanceMode: "click" },
    { id: "jeon-bars", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "눈을 떠 보니\n이곳에서 헤매고 있었고..\n\n당황스러운 마음에\n쇠창살을 손에 쥐니,\n\n갑자기 쇠창살이\n눈 녹듯이 부서졌습니다.", advanceMode: "click" },
    { id: "jeon-waited", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "어디로 가야 할지 모르고\n\n혼란스러운 마음에\n\n이곳에서 가만히 있었는데\n\n당신이 나타났지요.", advanceMode: "click" },
    { id: "player-thought-1", type: "dialogue", speakerName: "", text: "루나가 말한\n수상한 것이\n\n혹시 이 사람을 말하는 것일까?", advanceMode: "click" },
    { id: "player-thought-2", type: "dialogue", speakerName: "", text: "혹시 모르니\n\n베이스캠프로 데려가는 것이 좋을 것 같다.", advanceMode: "click" },
    { id: "jeon-invite", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "함께 가자는 말씀이십니까?", advanceMode: "click" },
    { id: "jeon-thanks", type: "dialogue", speakerId: "jeon", speakerName: "전", activeActorId: "jeon", text: "...정말 감사합니다.\n\n잘 부탁드리겠습니다.", advanceMode: "click" },
  ]), []);

  useEffect(() => {
    if (phase === "prisonFade") {
      const timer = window.setTimeout(() => setPhase("black"), 700);
      return () => window.clearTimeout(timer);
    }
    if (phase === "black") {
      const timer = window.setTimeout(() => setPhase("found"), 450);
      return () => window.clearTimeout(timer);
    }
    if (phase === "found") {
      const timer = window.setTimeout(() => setPhase("intro"), 700);
      return () => window.clearTimeout(timer);
    }
    if (phase === "pause") {
      const timer = window.setTimeout(() => setPhase("reveal"), 1500);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const showPrison = phase === "prison" || phase === "prisonFade";
  const showFound = phase === "found" || phase === "intro" || phase === "pause" || phase === "reveal";

  return (
    <div className="dungeon-four-story" aria-label="던전 4층 마지막 방 이야기">
      {showPrison && <img className={`dungeon-four-story-image ${phase === "prisonFade" ? "is-fading-out" : "is-fading-in"}`} src={prisonUrl} alt="가야의 철제 감옥 복도" />}
      {showFound && <img className="dungeon-four-story-image is-fading-in" src={foundUrl} alt="부서진 감옥 안에서 발견한 수상한 사람" />}
      {phase === "prison" && <StoryPlayer sequence={prisonSequence} onNavigate={() => undefined} onComplete={() => setPhase("prisonFade")} presentationMode="baseCampOverlay" />}
      {phase === "intro" && <StoryPlayer sequence={introSequence} playerName={playerName} onNavigate={() => undefined} onComplete={() => setPhase("pause")} presentationMode="baseCampOverlay" />}
      {phase === "reveal" && <StoryPlayer sequence={revealSequence} playerName={playerName} onNavigate={() => undefined} onComplete={onComplete} presentationMode="baseCampOverlay" />}
    </div>
  );
}
