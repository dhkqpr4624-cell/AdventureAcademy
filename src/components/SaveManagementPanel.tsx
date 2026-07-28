import { useRef, useState } from "react";
import { CURRENT_SAVE_VERSION, type CurrentSaveData } from "../save/saveTypes";
import { SaveManager } from "../save/SaveManager";

export function SaveManagementPanel({ currentData, onImport, onReset, onClose }: {
  currentData: () => CurrentSaveData; onImport: (data: CurrentSaveData) => void;
  onReset: () => void; onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const metadata = SaveManager.getMetadata();
  const download = () => {
    const result = SaveManager.exportJson(currentData());
    if (!result.success) { setMessage("세이브를 내보낼 수 없습니다."); return; }
    const blob = new Blob([result.json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `adventure-academy-save-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.json`;
    link.click(); URL.revokeObjectURL(url); setMessage("세이브를 내보냈습니다.");
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text(); const checked = (() => { try { return JSON.parse(text); } catch { return null; } })();
      if (!checked) { setMessage("올바른 JSON 파일이 아닙니다."); return; }
      const version = checked.version;
      if (typeof version === "number" && version > CURRENT_SAVE_VERSION) { setMessage("이 저장 파일은 현재 버전에서 불러올 수 없습니다."); return; }
      if (!window.confirm("현재 진행 상태를 백업하고 이 저장 파일을 불러오시겠습니까?")) return;
      const result = SaveManager.importJson(text);
      if (!result.success) { setMessage("저장 파일의 형식이 올바르지 않습니다."); return; }
      onImport(result.data); setMessage("세이브를 불러왔습니다.");
    } catch { setMessage("파일을 읽지 못했습니다."); }
    finally { if (inputRef.current) inputRef.current.value = ""; }
  };
  const reset = () => {
    if (!window.confirm("저장 데이터를 모두 삭제하고 처음부터 시작하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    const result = SaveManager.clear();
    if (!result.success) { setMessage("저장 데이터 일부를 삭제하지 못했습니다."); return; }
    onReset();
  };
  return (
    <section className="save-management-panel" aria-labelledby="save-management-title">
      <h2 id="save-management-title">세이브 관리</h2>
      <p>저장 버전 {CURRENT_SAVE_VERSION}</p>
      <ul>{metadata.map((item) => <li key={item.source}>{item.source} — {item.valid && item.savedAt ? new Date(item.savedAt).toLocaleString() : "없음 또는 손상"}</li>)}</ul>
      <div className="save-management-actions">
        <button type="button" onClick={download}>세이브 내보내기</button>
        <button type="button" onClick={() => inputRef.current?.click()}>세이브 불러오기</button>
        {([1,2,3] as const).map((index) => <button key={index} type="button" disabled={!metadata[index].valid} onClick={() => {
          if (!window.confirm(`최근 백업 ${index}을 복구하시겠습니까?`)) return;
          const result = SaveManager.restoreBackup(index); if (result.success) onImport(result.data); else setMessage("백업을 복구하지 못했습니다.");
        }}>백업 {index} 복구</button>)}
        <button type="button" onClick={reset}>세이브 초기화</button>
        <button type="button" onClick={onClose}>닫기</button>
      </div>
      <input ref={inputRef} className="sr-only" type="file" accept=".json,application/json" onChange={(event) => void importFile(event.target.files?.[0])} />
      {message && <p role="status">{message}</p>}
    </section>
  );
}
