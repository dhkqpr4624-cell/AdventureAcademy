import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { playRandomizedOneShot } from "../../game/audioOneShot";
import { withSubjectParticle } from "../../game/dungeon/dungeonDialogue";
import "./EndingSequenceScreen.css";

type EndingPhase =
  | "CORE_BREAK_IN"
  | "CORE_BREAK_HOLD"
  | "CORE_BREAK_OUT"
  | "GOLEM_DOWN_IN"
  | "GOLEM_DOWN_WAIT"
  | "GOLEM_DOWN_DIALOGUE"
  | "BASECAMP_DISAPPEAR_IN"
  | "BASECAMP_DISAPPEAR_WAIT"
  | "BASECAMP_DISAPPEAR_DIALOGUE"
  | "BASECAMP_DISAPPEAR_OUT"
  | "PORTAL_PREFACE_WAIT"
  | "PORTAL_PREFACE_DIALOGUE"
  | "PORTAL_OPEN_IN"
  | "PORTAL_OPEN_WAIT"
  | "PORTAL_OPEN_DIALOGUE"
  | "PARTY_ENTER_IN"
  | "PARTY_ENTER_WAIT"
  | "PARTY_ENTER_DIALOGUE"
  | "PLAYER_MONOLOGUE_IN"
  | "PLAYER_MONOLOGUE"
  | "ENDING_CREDIT"
  | "CREDIT_END_WAIT";

type DialoguePage = { speaker?: string; text: string };

const FADE_MS = 400;
const CREDIT_DURATION_MS = 82_000;
const GLASS_SFX_URL = `${import.meta.env.BASE_URL}assets/audio/glass-shatter-sfx.wav`;
const ENDING_BGM_URL = `${import.meta.env.BASE_URL}assets/audio/ending-credit-bgm.wav`;
const ASSET = {
  core: `${import.meta.env.BASE_URL}assets/ending/golem-core-break.png`,
  golem: `${import.meta.env.BASE_URL}assets/ending/ending-1-golem-down.png`,
  basecamp: `${import.meta.env.BASE_URL}assets/ending/ending-2-basecamp-disappear.png`,
  portal: `${import.meta.env.BASE_URL}assets/ending/ending-3-portal-open.png`,
  party: `${import.meta.env.BASE_URL}assets/ending/ending-4-party-enter.png`,
} as const;
const CREDIT_ACTORS = [
  { name: "카이든", imageUrl: `${import.meta.env.BASE_URL}assets/ending/credits/kaiden.png` },
  { name: "테오", imageUrl: `${import.meta.env.BASE_URL}assets/ending/credits/theo.png` },
  { name: "루나", imageUrl: `${import.meta.env.BASE_URL}assets/ending/credits/luna.png` },
  { name: "전(공민왕)", imageUrl: `${import.meta.env.BASE_URL}assets/ending/credits/jeon.png` },
] as const;

const AUTO_TRANSITIONS: Partial<Record<EndingPhase, { delay: number; next: EndingPhase }>> = {
  CORE_BREAK_IN: { delay: FADE_MS, next: "CORE_BREAK_HOLD" },
  CORE_BREAK_HOLD: { delay: 2_000, next: "CORE_BREAK_OUT" },
  CORE_BREAK_OUT: { delay: FADE_MS, next: "GOLEM_DOWN_IN" },
  GOLEM_DOWN_IN: { delay: FADE_MS, next: "GOLEM_DOWN_WAIT" },
  GOLEM_DOWN_WAIT: { delay: 1_500, next: "GOLEM_DOWN_DIALOGUE" },
  BASECAMP_DISAPPEAR_IN: { delay: FADE_MS, next: "BASECAMP_DISAPPEAR_WAIT" },
  BASECAMP_DISAPPEAR_WAIT: { delay: 1_500, next: "BASECAMP_DISAPPEAR_DIALOGUE" },
  BASECAMP_DISAPPEAR_OUT: { delay: FADE_MS, next: "PORTAL_PREFACE_WAIT" },
  PORTAL_PREFACE_WAIT: { delay: 1_000, next: "PORTAL_PREFACE_DIALOGUE" },
  PORTAL_OPEN_IN: { delay: FADE_MS, next: "PORTAL_OPEN_WAIT" },
  PORTAL_OPEN_WAIT: { delay: 1_500, next: "PORTAL_OPEN_DIALOGUE" },
  PARTY_ENTER_IN: { delay: FADE_MS, next: "PARTY_ENTER_WAIT" },
  PARTY_ENTER_WAIT: { delay: 1_500, next: "PARTY_ENTER_DIALOGUE" },
  PLAYER_MONOLOGUE_IN: { delay: FADE_MS, next: "PLAYER_MONOLOGUE" },
};

const DIALOGUES: Partial<Record<EndingPhase, DialoguePage[]>> = {
  GOLEM_DOWN_DIALOGUE: [
    { speaker: "루나", text: " 됐어! 쓰러뜨렸어..! " },
    { speaker: "테오", text: " 예상했던대로, 방금 쓰러뜨린 이 골렘이 이 포탈의 원흉이었던 듯하군요.. " },
    { speaker: "테오", text: " 그렇다는 것은 이제, 돌아갈 수 있다는 뜻이겠지요..! " },
    { speaker: "루나", text: " ..앗! 저길봐! " },
  ],
  BASECAMP_DISAPPEAR_DIALOGUE: [
    { speaker: "카이든", text: " 베이스캠프가..사라지고 있군.. " },
    { speaker: "테오", text: " 예, 무사히 이 던전을 클리어했다는 뜻이지요. " },
    { speaker: "테오", text: " 우리도 어서 돌아가야 합니다. " },
  ],
  PORTAL_PREFACE_DIALOGUE: [
    { speaker: "루나", text: " 대장! 테오! (플레이어 이름)! 저기 포탈이 보여! 우리가 돌아갈 수 있는 포탈 말이야!" },
  ],
  PORTAL_OPEN_DIALOGUE: [
    { speaker: "테오", text: "이제 정말 돌아갈 시간이군요.. 왠지 꿈같습니다.. " },
    { speaker: "카이든", text: " 돌아가면 우선 어드벤처 아카데미 본부로 돌아가야겠군. 어떤 일을 겪었는지 보고해야 한다. " },
    { speaker: "루나", text: " 으으으..!! 보고서 지옥이다!!! " },
    { speaker: "테오", text: " 하하하.. 보급품도 다시 한 번 정비해야겠습니다. " },
    { speaker: "카이든", text: " ... " },
    { speaker: "카이든", text: " 갑작스러웠지만, 그래도 생각해보면.. " },
    { speaker: "루나", text: " 나름 즐거운 모험이었어! " },
    { speaker: "테오", text: " 동감입니다. " },
    { speaker: "카이든", text: " ... " },
    { speaker: "루나", text: " 어!? 웃었다! " },
    { speaker: "루나", text: " 대장, 방금 웃은 거 맞지?! " },
    { speaker: "카이든", text: " 무슨 말인지 모르겠군. " },
    { speaker: "카이든", text: " 돌아가자. " },
  ],
  PARTY_ENTER_DIALOGUE: [
    { speaker: "카이든", text: " (플레이어 이름), 고생 많았다. 덕분에 누구도 다치지 않고 돌아갈 수 있겠군. " },
    { speaker: "테오", text: " 정말, (플레이어 이름)(이)가 없었다면 어땠을 지, 상상하기도 싫군요. " },
    { speaker: "루나", text: " (플레이어 이름) 덕분에 재밌는 일도 많이 생겼고 말이야! " },
    { speaker: "루나", text: " 그럼 이제, 본부에서 다시 만나자! (플레이어 이름)! " },
  ],
  PLAYER_MONOLOGUE: [
    { text: " 모두 포탈 너머로 걸어 들어갔다. " },
    { text: " 당신은 지난 모험을 되돌아보았다. " },
    { text: " 힘들었지만, 그만큼 재미있었던 모험이다. " },
    { text: " 당신은 이 일을 가슴 속에 추억으로 새기며, 포탈 속으로 걸어 들어간다. " },
  ],
};

function resolveEndingText(text: string, playerName: string): string {
  const name = playerName || "플레이어";
  return text
    .replaceAll("(플레이어 이름)(이)가", withSubjectParticle(name))
    .replaceAll("(플레이어 이름)", name)
    .replaceAll("(플레이어이름)", name);
}

function nextAfterDialogue(phase: EndingPhase): EndingPhase {
  if (phase === "GOLEM_DOWN_DIALOGUE") return "BASECAMP_DISAPPEAR_IN";
  if (phase === "BASECAMP_DISAPPEAR_DIALOGUE") return "BASECAMP_DISAPPEAR_OUT";
  if (phase === "PORTAL_PREFACE_DIALOGUE") return "PORTAL_OPEN_IN";
  if (phase === "PORTAL_OPEN_DIALOGUE") return "PARTY_ENTER_IN";
  if (phase === "PARTY_ENTER_DIALOGUE") return "PLAYER_MONOLOGUE_IN";
  return "ENDING_CREDIT";
}

function EndingCredits({ playerName, onComplete }: { playerName: string; onComplete: () => void }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const actorRefs = useRef<Array<HTMLImageElement | null>>([]);
  const completionRef = useRef(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const viewportHeight = viewport.clientHeight;
      const trackHeight = track.scrollHeight;
      const progress = Math.min(1, (now - startedAt) / CREDIT_DURATION_MS);
      const offset = viewportHeight - progress * (trackHeight + viewportHeight);
      track.style.transform = `translate3d(0, ${offset}px, 0)`;

      const gameDesign = track.querySelector<HTMLElement>('[data-credit-key="game-design"]');
      const special = track.querySelector<HTMLElement>('[data-credit-key="special-cast"]');
      if (gameDesign && special) {
        const startOffset = viewportHeight * 0.72 - gameDesign.offsetTop;
        const endOffset = viewportHeight * 0.62 - special.offsetTop;
        const actorProgress = Math.max(0, Math.min(1, (startOffset - offset) / (startOffset - endOffset)));
        const scaled = actorProgress * CREDIT_ACTORS.length;
        actorRefs.current.forEach((image, index) => {
          if (!image) return;
          const local = scaled - index;
          const fadeIn = Math.max(0, Math.min(1, local / 0.18));
          const fadeOut = Math.max(0, Math.min(1, (1 - local) / 0.18));
          image.style.opacity = String(Math.min(fadeIn, fadeOut));
        });
      }
      if (progress >= 1) {
        if (!completionRef.current) {
          completionRef.current = true;
          onComplete();
        }
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <section className="ending-credits" aria-label="엔딩 크레딧">
      <div className="ending-credits-left" ref={viewportRef}>
        <div className="ending-credits-track" ref={trackRef}>
          <CreditSection><h1>ADVENTURE ACADEMY</h1><h3>어드벤처 아카데미</h3></CreditSection>
          <CreditSection><h2>기획 · 제작</h2><strong>[고구마맛탕탕]</strong></CreditSection>
          <CreditSection creditKey="game-design"><h2>GAME DESIGN</h2><p>게임 기획<br />학습 콘텐츠 설계<br />스토리 및 퀘스트 구성<br />전투 및 던전 시스템 설계</p><strong>[고구마맛탕탕]</strong></CreditSection>
          <CreditSection><h2>DEVELOPMENT</h2><p>게임 프로그래밍<br />UI / UX 구현<br />게임 시스템 개발</p><strong>[고구마맛탕탕]</strong></CreditSection>
          <CreditSection><h2>ART &amp; DESIGN</h2><p>캐릭터 디자인<br />몬스터 디자인<br />배경 및 던전 디자인<br />UI 디자인<br />아이템 및 이펙트 디자인</p><strong>[고구마맛탕탕, 양평해장국]</strong></CreditSection>
          <CreditSection><h2>STORY</h2><p>세계관 설정<br />시나리오<br />캐릭터 및 대사</p><strong>[고구마맛탕탕, 양평해장국]</strong></CreditSection>
          <CreditSection><h2>EDUCATIONAL CONTENT</h2><p>학습 콘텐츠 기획<br />문제 및 해설 제작<br />교육과정 연계</p><strong>[고구마맛탕탕, 양평해장국]</strong></CreditSection>
          <CreditSection><h2>MUSIC &amp; SOUND</h2><p>Background Music<br />Sound Effects</p><strong>[ElevenLabs]</strong></CreditSection>
          <CreditSection><h2>SPECIAL THANKS</h2><p>이 모험을 함께해 준<br />모든 선생님과 학생들에게<br /><br />그리고<br /><br />끝까지 이 이야기를 플레이해 준<br />당신에게.</p></CreditSection>
          <CreditSection><h2>ADVENTURE ACADEMY</h2><p>모든 기억의 조각은 제자리를 찾았습니다.<br /><br />뒤틀렸던 시간은 다시 흐르기 시작했고,<br />원정대의 긴 임무도 끝을 맞이했습니다.<br /><br />하지만 역사는<br />누군가 기억하는 한 계속됩니다.<br /><br />그리고 이 모험 역시<br />여기서 완전히 끝나는 것은 아닙니다.</p></CreditSection>
          <CreditSection><h2>지휘관</h2><strong>[카이든]</strong></CreditSection>
          <CreditSection><h2>보급관</h2><strong>[테오]</strong></CreditSection>
          <CreditSection><h2>정찰</h2><strong>[루나]</strong></CreditSection>
          <CreditSection creditKey="special-cast"><h2>특별출연</h2><strong>[전(공민왕)]</strong></CreditSection>
          <CreditSection final><h3>마지막까지 함께한 모험가</h3><h1>주인공</h1><h2>「{playerName || "플레이어"}」</h2></CreditSection>
        </div>
      </div>
      <div className="ending-credits-right" aria-hidden="true">
        {CREDIT_ACTORS.map((actor, index) => (
          <img key={actor.name} ref={(node) => { actorRefs.current[index] = node; }} src={actor.imageUrl} alt="" />
        ))}
      </div>
    </section>
  );
}

function CreditSection({ children, creditKey, final = false }: { children: ReactNode; creditKey?: string; final?: boolean }) {
  return <section className={`ending-credit-section${final ? " is-final" : ""}`} data-credit-key={creditKey}>{children}</section>;
}

export function EndingSequenceScreen({ playerName, onComplete }: { playerName: string; onComplete: () => void }) {
  const [phase, setPhase] = useState<EndingPhase>("CORE_BREAK_IN");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const endingBgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmRestartTimerRef = useRef<number | null>(null);

  const startEndingBgm = () => {
    if (endingBgmRef.current || typeof Audio === "undefined") return;
    const audio = new Audio(ENDING_BGM_URL);
    audio.loop = false;
    audio.preload = "auto";
    audio.volume = 0.65;
    const restart = () => {
      bgmRestartTimerRef.current = window.setTimeout(() => {
        bgmRestartTimerRef.current = null;
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }, 2_500);
    };
    audio.onended = restart;
    endingBgmRef.current = audio;
    void audio.play().catch(() => undefined);
  };

  useEffect(() => {
    playRandomizedOneShot(GLASS_SFX_URL);
    return () => {
      if (bgmRestartTimerRef.current !== null) window.clearTimeout(bgmRestartTimerRef.current);
      const audio = endingBgmRef.current;
      if (audio) {
        audio.onended = null;
        audio.pause();
        audio.currentTime = 0;
      }
      endingBgmRef.current = null;
    };
  }, []);

  useEffect(() => {
    const transition = AUTO_TRANSITIONS[phase];
    if (!transition) return;
    const timer = window.setTimeout(() => setPhase(transition.next), transition.delay);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    setDialogueIndex(0);
    if (phase === "BASECAMP_DISAPPEAR_IN") startEndingBgm();
  }, [phase]);

  const dialogue = DIALOGUES[phase];
  const page = dialogue?.[dialogueIndex];
  const advanceDialogue = () => {
    if (!dialogue) return;
    if (dialogueIndex + 1 < dialogue.length) {
      setDialogueIndex((current) => current + 1);
      return;
    }
    setPhase(nextAfterDialogue(phase));
  };

  const layers = useMemo(() => {
    const golemVisible = phase.startsWith("GOLEM_DOWN") || phase.startsWith("BASECAMP_DISAPPEAR");
    const basecampVisible = phase.startsWith("BASECAMP_DISAPPEAR");
    const portalVisible = phase.startsWith("PORTAL_OPEN") || phase.startsWith("PARTY_ENTER");
    const partyVisible = phase.startsWith("PARTY_ENTER") || phase === "PLAYER_MONOLOGUE_IN";
    return { golemVisible, basecampVisible, portalVisible, partyVisible };
  }, [phase]);

  if (phase === "ENDING_CREDIT") {
    return <EndingCredits playerName={playerName} onComplete={() => setPhase("CREDIT_END_WAIT")} />;
  }
  if (phase === "CREDIT_END_WAIT") {
    return <EndingReturnWait onComplete={onComplete} />;
  }

  return (
    <main className="ending-sequence-screen" data-phase={phase}>
      {layers.golemVisible && <img className={`ending-fullscreen-image ending-golem${phase === "GOLEM_DOWN_IN" ? " is-fading-in" : ""}${phase === "BASECAMP_DISAPPEAR_OUT" ? " is-fading-out" : ""}`} src={ASSET.golem} alt="쓰러진 뒤틀린 문명의 골렘" />}
      {layers.basecampVisible && <img className={`ending-fullscreen-image ending-basecamp${phase === "BASECAMP_DISAPPEAR_IN" ? " is-fading-in" : ""}${phase === "BASECAMP_DISAPPEAR_OUT" ? " is-fading-out" : ""}`} src={ASSET.basecamp} alt="사라지는 베이스캠프" />}
      {layers.portalVisible && <img className={`ending-fullscreen-image ending-portal${phase === "PORTAL_OPEN_IN" ? " is-fading-in" : ""}`} src={ASSET.portal} alt="돌아가는 포탈" />}
      {layers.partyVisible && <img className={`ending-fullscreen-image ending-party${phase === "PARTY_ENTER_IN" ? " is-fading-in" : ""}${phase === "PLAYER_MONOLOGUE_IN" ? " is-fading-out" : ""}`} src={ASSET.party} alt="포탈로 들어가는 동료들" />}
      {phase.startsWith("CORE_BREAK") && <img className={`ending-core-image${phase === "CORE_BREAK_IN" ? " is-fading-in" : ""}${phase === "CORE_BREAK_OUT" ? " is-fading-out" : ""}`} src={ASSET.core} alt="깨지는 골렘의 핵" />}
      {page && (
        <section className="ending-dialogue" role="dialog" aria-live="polite">
          {page.speaker && <strong className="ending-dialogue-speaker">{page.speaker}</strong>}
          <p>{resolveEndingText(page.text, playerName)}</p>
          <button type="button" onClick={advanceDialogue}>다음</button>
        </section>
      )}
    </main>
  );
}

function EndingReturnWait({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2_000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);
  return <main className="ending-sequence-screen" aria-label="엔딩 종료" />;
}
