import { useState } from "react";

export function IntroTextPlayer({ lines, onComplete }: { lines: string[]; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const line = lines[index];
  const next = () => {
    if (index + 1 >= lines.length) onComplete();
    else setIndex((current) => current + 1);
  };

  if (!line) {
    onComplete();
    return null;
  }

  return (
    <main className="intro-text-player" aria-label="인트로 텍스트">
      <button type="button" className="intro-text-advance" onClick={next} aria-label="다음 문장">
        <span className="intro-text-content">
          <span key={index} className="intro-text-line">{line}</span>
          <span className="intro-text-caret" aria-hidden="true">▼</span>
        </span>
      </button>
    </main>
  );
}
