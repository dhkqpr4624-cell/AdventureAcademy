import { isDebugToggleShortcut } from "./screens/TitleScreen/TitleScreen";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runPhase29_12Checks() {
  assert(isDebugToggleShortcut({ ctrlKey: true, shiftKey: true, key: "d" }), "Ctrl+Shift+D must toggle debug visibility");
  assert(isDebugToggleShortcut({ ctrlKey: true, shiftKey: true, key: "D" }), "shortcut must accept uppercase D");
  assert(!isDebugToggleShortcut({ ctrlKey: false, shiftKey: true, key: "d" }), "shortcut must require Ctrl");
  assert(!isDebugToggleShortcut({ ctrlKey: true, shiftKey: false, key: "d" }), "shortcut must require Shift");
  assert(!isDebugToggleShortcut({ ctrlKey: true, shiftKey: true, key: "x" }), "shortcut must require D");
}
