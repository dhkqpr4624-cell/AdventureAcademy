import introScriptSource from "./intro_script.txt?raw";

type ScriptDialogue = {
  speakerId: string;
  speakerName: string;
  text: string;
};

const SPEAKERS: Record<string, Omit<ScriptDialogue, "text">> = {
  Luna: { speakerId: "luna", speakerName: "루나" },
  Theo: { speakerId: "theo", speakerName: "테오" },
  Kaiden: { speakerId: "kaiden", speakerName: "카이든" },
  선원: { speakerId: "sailor", speakerName: "선원" },
};

function sceneBody(sceneNumber: number) {
  const start = introScriptSource.indexOf(`Scene ${sceneNumber}`);
  const end = introScriptSource.indexOf(`Scene ${sceneNumber + 1}`, start + 1);
  return introScriptSource.slice(start, end < 0 ? undefined : end);
}

function parseDialogues(sceneNumber: number): ScriptDialogue[] {
  const lines = sceneBody(sceneNumber).replaceAll("\r", "").split("\n");
  const result: ScriptDialogue[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const speaker = SPEAKERS[lines[index].trim()];
    if (!speaker) continue;

    const text: string[] = [];
    for (index += 1; index < lines.length; index += 1) {
      const line = lines[index].trimEnd();
      if (!line.trim()) break;
      if (line.trim().startsWith("[")) break;
      text.push(line);
    }
    result.push({ ...speaker, text: text.join("\n") });
  }
  return result;
}

const scene0Body = sceneBody(0).replaceAll("\r", "");
const scene0Content = scene0Body
  .slice(scene0Body.indexOf("========================", scene0Body.indexOf("Adventure Academy")) + 24)
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("="));

export const INTRO_SCRIPT = {
  scene0: scene0Content,
  scene1: parseDialogues(1),
  scene2: parseDialogues(2),
};
