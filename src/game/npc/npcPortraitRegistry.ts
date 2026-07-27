import { NPC_DEFINITIONS } from "./npcDefinitions";

export const NPC_PORTRAIT_REGISTRY = Object.fromEntries(
  NPC_DEFINITIONS.flatMap((npc) =>
    Object.entries(npc.portraits)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([expression, imageUrl]) => [
        `${npc.id}.${expression}`,
        imageUrl,
      ]),
  ),
) as Record<string, string>;

