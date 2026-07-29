import { useEffect, useState } from "react";

const DIALOGUE = [
  ["카이든", "이건.."],
  ["테오", "웅녀와 환웅의 아들\n단군왕검이\n고조선이라는 나라를 세우다."],
  ["테오", "저희가 찾은 것은\n우리나라 역사의 시작을\n보여주는 비석이었나 보군요."],
  ["테오", "...!"],
  ["루나", "대장!\n던전 2층으로 가는 문이 열린 것 같아."],
  ["카이든", "그래.\n이제 다음 계획을 세워야겠군."],
] as const;

export function MemoryCompletionStory({ beforeUrl, afterUrl, onComplete }: {
  beforeUrl: string; afterUrl: string; onComplete: () => void;
}) {
  const [joined, setJoined] = useState(false);
  const [line, setLine] = useState(-1);
  useEffect(() => {
    const timer = window.setTimeout(() => { setJoined(true); setLine(0); }, 3000);
    return () => window.clearTimeout(timer);
  }, []);
  const next = () => line >= DIALOGUE.length - 1 ? onComplete() : setLine((value) => value + 1);
  return (
    <div className={`memory-completion-overlay ${line === 3 ? "is-quaking" : ""}`}>
      <img src={joined ? afterUrl : beforeUrl} alt={joined ? "완성된 고조선 건국 비석" : "서로 연결되기 전의 두 기억 조각"} />
      {line >= 0 && <div className="memory-completion-dialogue"><strong>{DIALOGUE[line][0]}</strong><p>{DIALOGUE[line][1]}</p><button type="button" onClick={next}>다음</button></div>}
    </div>
  );
}
