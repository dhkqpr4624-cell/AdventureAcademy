import type { CurrentSaveData, SaveReason, SaveResult } from "./saveTypes";
import { SaveManager } from "./SaveManager";

export class AutoSaveCoordinator {
  private timer: number | null = null;
  private saving = false;
  private pending = false;
  private latestReason: SaveReason = "manual";
  private lastMeaningful = "";
  constructor(private readonly snapshot: () => CurrentSaveData, private readonly onResult?: (result: SaveResult) => void) {}
  requestSave(reason: SaveReason) {
    this.latestReason = reason; this.pending = true;
    if (this.timer === null) this.timer = window.setTimeout(() => this.flush(), 180);
  }
  flush(reason?: SaveReason) {
    if (this.timer !== null) { window.clearTimeout(this.timer); this.timer = null; }
    if (this.saving) { this.pending = true; return; }
    this.saving = true; this.pending = false;
    const data = this.snapshot();
    const meaningful = JSON.stringify({ ...data, savedAt: "" });
    const skip = meaningful === this.lastMeaningful && (reason ?? this.latestReason) === "interval";
    const result = skip ? { success: true as const, savedAt: data.savedAt, skipped: true } : SaveManager.save(data, reason ?? this.latestReason);
    if (result.success && !result.skipped) this.lastMeaningful = meaningful;
    this.onResult?.(result); this.saving = false;
    if (this.pending) this.requestSave(this.latestReason);
  }
  dispose() { if (this.timer !== null) window.clearTimeout(this.timer); this.timer = null; }
}
