import { useEffect, useMemo, useState } from "react";
import { StoryPlayer } from "../../game/story/StoryPlayer";
import { DungeonFloorIntro } from "../../components/DungeonFloorIntro";
import { QuestRewardPopup } from "../../components/QuestRewardPopup";
import { DUNGEON5_ENTRY_STORY, DUNGEON5_GATE_STORY } from "../../data/stories/dungeon5Stories";
import type { PlayerState } from "../../game/player/playerState";
import type { ScreenId } from "../../app/routes";
import { createDungeon5Route, getDungeon5Directions } from "../../game/dungeon5/dungeon5Generator";

type Props = { playerState: PlayerState; onNavigate: (screen: ScreenId) => void; onCleared: () => void; onClaim: () => void };
export function Dungeon5Screen({ playerState, onNavigate, onCleared, onClaim }: Props) {
  const [mode, setMode] = useState<"title" | "entry" | "road" | "gate" | "reward">("title");
  const [position, setPosition] = useState(0);
  const route = useMemo(() => createDungeon5Route(), []);
  const stop = route[position];
  const directions = getDungeon5Directions(position, route.length);
  useEffect(() => {
    if (mode !== "title") return;
    const timer = window.setTimeout(() => setMode("entry"), 2200);
    return () => window.clearTimeout(timer);
  }, [mode]);
  if (mode === "title") return <DungeonFloorIntro floorId="floor-5" />;
  if (mode === "entry") return <StoryPlayer sequence={DUNGEON5_ENTRY_STORY} playerName={playerState.name} playerStatus={playerState} onNavigate={onNavigate} onComplete={() => setMode("road")} />;
  if (mode === "gate") return <StoryPlayer sequence={DUNGEON5_GATE_STORY} playerName={playerState.name} playerStatus={playerState} onNavigate={onNavigate} onComplete={() => { onCleared(); setMode("reward"); }} />;
  return <main className="dungeon5-screen">
    <div className="dungeon5-sky" />
    <div className="dungeon5-mountains" />
    <div className="dungeon5-floor" />
    {mode === "road" && stop.sceneryImage && <>
      <img className={`dungeon5-battle-scene side-${position % 2}`} src={`${import.meta.env.BASE_URL}assets/dungeon5/${stop.sceneryImage}`} alt="주변에서 이어지는 전쟁 장면" />
      <section className="dungeon5-encounter">
        <img src={`${import.meta.env.BASE_URL}assets/monsters/${stop.monsterImage}`} alt={stop.monsterName} />
        <strong>{stop.monsterName}</strong>
      </section>
    </>}
    {mode === "road" && <nav className="dungeon5-navigation" aria-label="던전 5층 직선 이동">
      <button type="button" disabled={!directions.canMoveBack} onClick={() => setPosition((value) => Math.max(0, value - 1))}>뒤</button>
      <button type="button" onClick={() => position >= route.length - 2 ? setMode("gate") : setPosition((value) => value + 1)}>앞</button>
    </nav>}
    {mode === "reward" && <QuestRewardPopup bestCorrect={12} requiredCorrect={9} rareRewardItemId="armor-munmu" questTitle="던전 5층 조사 완료" claimed={false} onClaim={onClaim} onCancel={() => onNavigate("baseCamp")} />}
  </main>;
}
