import theoStandingL from "../../assets/story/npcs/theo/standing_L.png";
import theoStandingR from "../../assets/story/npcs/theo/standing_R.png";
import theoWalkL from "../../assets/story/npcs/theo/walk_L.png";
import theoWalkR from "../../assets/story/npcs/theo/walk_R.png";
import theoFallL from "../../assets/story/npcs/theo/falldown_L.png";
import theoFallR from "../../assets/story/npcs/theo/falldown_R.png";
import kaidenStandingL from "../../assets/story/npcs/kaiden/standing_L.png";
import kaidenStandingR from "../../assets/story/npcs/kaiden/standing_R.png";
import kaidenWalkL from "../../assets/story/npcs/kaiden/walk_L.png";
import kaidenWalkR from "../../assets/story/npcs/kaiden/walk_R.png";
import kaidenFallL from "../../assets/story/npcs/kaiden/falldown_L.png";
import kaidenFallR from "../../assets/story/npcs/kaiden/falldown_R.png";
import lunaStandingL from "../../assets/story/npcs/luna/standing_L.png";
import lunaStandingR from "../../assets/story/npcs/luna/standing_R.png";
import lunaWalkL from "../../assets/story/npcs/luna/walk_L.png";
import lunaWalkR from "../../assets/story/npcs/luna/walk_R.png";
import lunaFallL from "../../assets/story/npcs/luna/falldown_L.png";
import lunaFallR from "../../assets/story/npcs/luna/falldown_R.png";
import type { StoryFacing, StoryNpcPose } from "../../types/story";

type StoryNpcAssets = Record<StoryFacing, Record<StoryNpcPose, string>>;

export const STORY_NPC_FRAME_WIDTH = 380;
export const STORY_NPC_FRAME_HEIGHT = 600;
export const STORY_NPC_WALK_FPS = 5;
export const STORY_NPC_WALK_FRAME_COUNT = 4;

const makeAssets = (
  standingL: string, standingR: string, walkL: string, walkR: string,
  fallL: string, fallR: string,
): StoryNpcAssets => ({
  Left: { Standing: standingL, Walking: walkL, FallDown: fallL },
  Right: { Standing: standingR, Walking: walkR, FallDown: fallR },
});

export const STORY_NPC_ASSETS: Record<string, StoryNpcAssets> = {
  theo: makeAssets(theoStandingL, theoStandingR, theoWalkL, theoWalkR, theoFallL, theoFallR),
  kaiden: makeAssets(kaidenStandingL, kaidenStandingR, kaidenWalkL, kaidenWalkR, kaidenFallL, kaidenFallR),
  luna: makeAssets(lunaStandingL, lunaStandingR, lunaWalkL, lunaWalkR, lunaFallL, lunaFallR),
};

export function getStoryNpcAsset(actorId: string, pose: StoryNpcPose, facing: StoryFacing) {
  return STORY_NPC_ASSETS[actorId]?.[facing]?.[pose];
}
