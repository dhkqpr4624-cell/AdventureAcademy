import type { ReactNode } from "react";

export type CombatDialogueMode =
  | "message"
  | "command"
  | "question"
  | "review"
  | "result";

type CombatDialoguePanelProps = {
  mode: CombatDialogueMode;
  children: ReactNode;
  busy?: boolean;
};

export function CombatDialoguePanel({
  mode,
  children,
  busy = false,
}: CombatDialoguePanelProps) {
  return (
    <section
      className={`combat-dialogue-panel is-${mode}`}
      aria-label="전투 대화"
      aria-busy={busy}
      data-mode={mode}
    >
      <div className="combat-dialogue-label">DIALOGUE</div>
      <div className="combat-dialogue-content">{children}</div>
    </section>
  );
}
