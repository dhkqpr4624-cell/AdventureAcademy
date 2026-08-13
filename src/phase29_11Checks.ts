import { applyFloorMonsterData } from "./screens/DungeonScreen/DungeonScreen";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runPhase29_11Checks() {
  const floor3 = applyFloorMonsterData(createDungeonRun("floor-3", "phase29-11-floor3").map, "phase29-11-floor3", "floor-3");
  const floor4 = applyFloorMonsterData(createDungeonRun("floor-4", "phase29-11-floor4").map, "phase29-11-floor4", "floor-4");
  const floor3Ids = floor3.rooms.flatMap((room) => room.type === "combat" ? [room.combatConfig!.monsterId] : room.type === "elite" ? [room.eliteConfig!.monsterId] : []);
  const floor4Ids = floor4.rooms.flatMap((room) => room.type === "combat" ? [room.combatConfig!.monsterId] : room.type === "elite" ? [room.eliteConfig!.monsterId] : []);
  assert(floor3Ids.every((id) => ["baekje-smile", "goguryeo-samjogo", "twisted-pensive-bodhisattva"].includes(id)), "Dungeon 3 monster assignment changed");
  assert(floor4Ids.every((id) => ["gold-crown-wraith", "corrupted-gaya-pottery", "silla-cheonma"].includes(id)), "Dungeon 4 has an old monster assignment");

  const questIds = ["quest-floor-1-prehistory", "quest-floor-2-memory-fragment", "quest-floor-3-torn-cloth", "quest-floor-4-jeon-rescue"];
  for (const [index, floor] of (["floor-1", "floor-2", "floor-3", "floor-4"] as const).entries()) {
    const state = createDebugFloorJumpState(floor);
    assert(state.questState[questIds[index]] === "available", `${floor} target quest must be available`);
    assert(state.clearedFloorIds.length === index, `${floor} cleared floor count mismatch`);
    assert(state.playerState.gold === index * 5, `${floor} gold mismatch`);
    assert(Object.keys(state.rewardClaimed).length === index, `${floor} claimed reward count mismatch`);
    assert(Object.keys(state.achievementReceived).length === index, `${floor} achievement count mismatch`);
    assert(!Object.keys(state.inventoryState.items).some((id) => id.startsWith("quest-")), `${floor} must not retain quest items`);
    for (let previous = 0; previous < index; previous += 1) assert(state.questState[questIds[previous]] === "completed", `${floor} previous quest incomplete`);
  }
}
