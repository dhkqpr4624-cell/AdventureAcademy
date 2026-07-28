import { SAVE_STORAGE_KEYS as K } from "./saveConstants";
import { migrateSaveData } from "./SaveMigration";
import type { CurrentSaveData, ImportResult, LoadResult, SaveReason, SaveResult, SaveSource } from "./saveTypes";

const storage = () => { try { return window.localStorage; } catch { return null; } };
const parse = (text: string | null): ImportResult => {
  if (text === null) return { success: false, reason: "notFound" };
  try { return migrateSaveData(JSON.parse(text)); } catch { return { success: false, reason: "invalidJson" }; }
};
const keyForSource = (source: SaveSource) => source === "main" ? K.main : K[`backup${source.slice(-1)}` as "backup1"];
const quota = (error: unknown) => error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");

export function planBackupRotation(main: string | null, backup1: string | null, backup2: string | null) {
  return { backup1: main, backup2: backup1, backup3: backup2 };
}

export const SaveManager = {
  save(data: CurrentSaveData, _reason: SaveReason = "manual"): SaveResult {
    let serialized: string;
    try { serialized = JSON.stringify(data); } catch (error) { return { success: false, reason: "serializationFailed", error }; }
    const target = storage();
    if (!target) return { success: false, reason: "storageUnavailable" };
    try {
      const current = target.getItem(K.main);
      const validCurrent = parse(current).success;
      if (validCurrent && current !== serialized) {
        const b1 = target.getItem(K.backup1), b2 = target.getItem(K.backup2);
        const rotation = planBackupRotation(current, b1, b2);
        if (rotation.backup3 !== null) target.setItem(K.backup3, rotation.backup3);
        if (rotation.backup2 !== null) target.setItem(K.backup2, rotation.backup2);
        target.setItem(K.backup1, rotation.backup1!);
      }
      target.setItem(K.main, serialized);
      return { success: true, savedAt: data.savedAt, skipped: current === serialized };
    } catch (error) {
      return { success: false, reason: quota(error) ? "quotaExceeded" : "unknown", error };
    }
  },
  loadMain(): LoadResult {
    const target = storage(); if (!target) return { success: false, reason: "notFound" };
    const result = parse(target.getItem(K.main));
    return result.success ? { ...result, source: "main" } : result;
  },
  loadBackup(index: 1 | 2 | 3): LoadResult {
    const target = storage(); if (!target) return { success: false, reason: "notFound" };
    const source = `backup-${index}` as SaveSource; const result = parse(target.getItem(keyForSource(source)));
    return result.success ? { ...result, source } : result;
  },
  load(): LoadResult {
    const main = this.loadMain(); if (main.success) return main;
    for (const index of [1, 2, 3] as const) { const backup = this.loadBackup(index); if (backup.success) return backup; }
    return { success: false, reason: main.reason === "notFound" ? "notFound" : "allBackupsInvalid" };
  },
  restoreBackup(index: 1 | 2 | 3): LoadResult {
    const result = this.loadBackup(index); if (!result.success) return result;
    const saved = this.save({ ...result.data, savedAt: new Date().toISOString() }, "manual");
    return saved.success ? result : { success: false, reason: "migrationFailed" };
  },
  exportJson(data?: CurrentSaveData) {
    const candidate = data ?? (this.load().success ? (this.load() as Extract<LoadResult, {success:true}>).data : null);
    if (!candidate) return { success: false as const, reason: "notFound" as const };
    try { return { success: true as const, json: JSON.stringify(candidate, null, 2) }; } catch { return { success: false as const, reason: "invalidSchema" as const }; }
  },
  importJson(jsonText: string): ImportResult {
    const result = parse(jsonText); if (!result.success) return result;
    const saved = this.save({ ...result.data, savedAt: new Date().toISOString() }, "imported");
    return saved.success ? { ...result, data: { ...result.data, savedAt: saved.savedAt } } : { success: false, reason: "migrationFailed" };
  },
  clear() {
    const target = storage(); if (!target) return { success: false as const, reason: "storageUnavailable" as const };
    try { Object.values(K).forEach((key) => target.removeItem(key)); return { success: true as const }; }
    catch (error) { return { success: false as const, reason: "unknown" as const, error }; }
  },
  getMetadata() {
    const sources: SaveSource[] = ["main", "backup-1", "backup-2", "backup-3"];
    return sources.map((source) => { const result = source === "main" ? this.loadMain() : this.loadBackup(Number(source.slice(-1)) as 1|2|3); return { source, valid: result.success, savedAt: result.success ? result.data.savedAt : null }; });
  },
};
