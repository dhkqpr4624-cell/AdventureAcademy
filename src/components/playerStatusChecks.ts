import { getPlayerStatusView } from "./PlayerStatusBar";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[player status checks] ${message}`);
}

export function runPlayerStatusChecks() {
  const normal = getPlayerStatusView({ currentHp: 43, maxHp: 50, gold: 7 });
  assert(normal.currentHp === 43 && normal.maxHp === 50, "43 / 50 display");
  assert(normal.gold === 7, "gold display");
  assert(!normal.questionLabel, "non-combat question label");
  assert(
    getPlayerStatusView({ currentHp: 80, maxHp: 50, gold: 0 }).currentHp === 50,
    "maximum clamp",
  );
  assert(
    getPlayerStatusView({ currentHp: -5, maxHp: 50, gold: 0 }).currentHp === 0,
    "minimum clamp",
  );
  assert(
    getPlayerStatusView({
      currentHp: 50,
      maxHp: 50,
      gold: 0,
      questionLabel: "1 / 2",
    }).questionLabel === "1 / 2",
    "combat question label",
  );
}
