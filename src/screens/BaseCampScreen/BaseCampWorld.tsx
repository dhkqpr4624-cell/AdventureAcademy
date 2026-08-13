import { useState } from "react";
import type {
  BaseCampInteractionRegion,
  BaseCampMapDefinition,
  BaseCampMode,
} from "../../types/baseCamp";
import { NPC_DEFINITIONS } from "../../game/npc/npcDefinitions";
import type { NpcDefinition } from "../../game/npc/npcTypes";
import { resolveNpcPresentation } from "../../game/npc/npcPresentationResolver";
import { NpcIdleSprite } from "../../components/NpcIdleSprite";
import { BASE_CAMP_LAYER } from "../../game/baseCamp/baseCampLayers";
import { NpcNameTag } from "../../components/NpcNameTag";
import { NpcQuestMarker } from "../../components/NpcQuestMarker";
import { DungeonEntranceButton } from "../../components/DungeonEntranceButton";
import type { QuestState } from "../../game/quest/questTypes";
import { resolveNpcQuestMarker } from "../../game/quest/questMarkerResolver";

type BaseCampWorldProps = {
  map: BaseCampMapDefinition;
  mode: BaseCampMode;
  selectedRegionId: string | null;
  onSelectRegion: (region: BaseCampInteractionRegion) => void;
  highlightTargetId?: string | null;
  selectedNpcId?: string | null;
  onSelectNpc?: (npc: NpcDefinition) => void;
  interactionsDisabled?: boolean;
  questState: QuestState;
  visibleNpcIds?: readonly string[];
};

type LayerName = keyof BaseCampMapDefinition["layers"];

type LayerLoadState = {
  status: "loading" | "loaded" | "error";
  naturalWidth?: number;
  naturalHeight?: number;
};

const LAYER_ORDER: LayerName[] = [
  "background",
  "ground",
  "dungeonEntrance",
  "dungeonEntranceButton",
  "foreground",
];

export function BaseCampWorld({
  map,
  mode,
  selectedRegionId,
  onSelectRegion,
  highlightTargetId = null,
  selectedNpcId = null,
  onSelectNpc,
  interactionsDisabled = false,
  questState,
  visibleNpcIds,
}: BaseCampWorldProps) {
  const [highlightedNpcId, setHighlightedNpcId] = useState<string | null>(null);
  const [dungeonEntranceHighlighted, setDungeonEntranceHighlighted] =
    useState(false);
  const layerStyle = {
    width: map.worldWidth,
    height: map.worldHeight,
  };
  const [layerLoadStates, setLayerLoadStates] = useState<
    Record<LayerName, LayerLoadState>
  >(() =>
    Object.fromEntries(
      LAYER_ORDER.map((layerName) => [layerName, { status: "loading" }]),
    ) as Record<LayerName, LayerLoadState>,
  );

  const handleLayerLoad = (
    layerName: LayerName,
    image: HTMLImageElement,
  ) => {
    const loadState: LayerLoadState = {
      status: "loaded",
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
    setLayerLoadStates((current) => ({
      ...current,
      [layerName]: loadState,
    }));

    if (import.meta.env.DEV) {
      console.info(
        `[BaseCamp] ${layerName} loaded: ${image.currentSrc} (${image.naturalWidth}×${image.naturalHeight})`,
      );
    }
  };

  const handleLayerError = (layerName: LayerName, image: HTMLImageElement) => {
    setLayerLoadStates((current) => ({
      ...current,
      [layerName]: { status: "error" },
    }));

    if (import.meta.env.DEV) {
      console.error(
        `[BaseCamp] ${layerName} failed to load: ${image.currentSrc || image.src}`,
      );
    }
  };

  const renderLayerImage = (layerName: LayerName) => (
    <img
      src={map.layers[layerName]}
      alt=""
      draggable={false}
      onLoad={(event) => handleLayerLoad(layerName, event.currentTarget)}
      onError={(event) => handleLayerError(layerName, event.currentTarget)}
    />
  );
  const highlightedRegion = highlightTargetId
    ? map.interactionRegions.find((region) => region.id === highlightTargetId)
    : undefined;

  return (
    <div
      className="base-camp-world"
      style={layerStyle}
      data-testid="BaseCampWorld"
    >
      <div
        className="base-camp-layer background-layer"
        style={{ zIndex: BASE_CAMP_LAYER.background }}
        aria-hidden="true"
      >
        {renderLayerImage("background")}
      </div>
      <div
        className="base-camp-layer dungeon-entrance-layer"
        style={{ zIndex: BASE_CAMP_LAYER.structures }}
        aria-hidden="true"
      >
        {renderLayerImage("dungeonEntrance")}
      </div>
      <div
        className={`base-camp-layer dungeon-entrance-button-layer ${
          dungeonEntranceHighlighted ? "is-highlighted" : ""
        }`}
        style={{ zIndex: BASE_CAMP_LAYER.dungeonEntranceButton }}
        aria-hidden="true"
      >
        {renderLayerImage("dungeonEntranceButton")}
      </div>
      <div
        className="base-camp-layer ground-layer"
        style={{ zIndex: BASE_CAMP_LAYER.ground }}
        aria-hidden="true"
      >
        {renderLayerImage("ground")}
      </div>
      <div
        className="base-camp-layer foreground-layer"
        style={{ zIndex: BASE_CAMP_LAYER.foreground }}
        aria-hidden="true"
      >
        {renderLayerImage("foreground")}
      </div>
      <div
        className="base-camp-layer npc-layer"
        style={{ zIndex: BASE_CAMP_LAYER.npcSprite }}
      >
        {NPC_DEFINITIONS.filter((npc) => !visibleNpcIds || visibleNpcIds.includes(npc.id)).map((npc) => (
          <NpcIdleSprite
            key={npc.id}
            npc={npc}
            selected={selectedNpcId === npc.id}
            interactionHighlighted={
              highlightedNpcId === npc.id || selectedNpcId === npc.id
            }
          />
        ))}
      </div>
      <div
        className={`base-camp-layer interaction-layer ${
          mode === "story" || interactionsDisabled ? "is-disabled" : ""
        }`}
        style={{ zIndex: BASE_CAMP_LAYER.interactionOverlay }}
      >
        {NPC_DEFINITIONS.filter((npc) => !visibleNpcIds || visibleNpcIds.includes(npc.id)).map((npc) => {
          const presentation = resolveNpcPresentation(npc.id);
          const questMarker = resolveNpcQuestMarker(npc, questState);
          return (
            <button
              key={presentation.id}
              type="button"
              className={`base-camp-npc-interaction ${
                selectedNpcId === npc.id ? "is-selected" : ""
              }`}
              style={{
                left: npc.placement.x,
                top: npc.placement.y,
                width: npc.placement.width,
                height: npc.placement.height,
              }}
              disabled={mode === "story" || interactionsDisabled}
              onClick={() => onSelectNpc?.(npc)}
              onPointerEnter={() => setHighlightedNpcId(npc.id)}
              onPointerLeave={() =>
                setHighlightedNpcId((current) =>
                  current === npc.id ? null : current
                )
              }
              onFocus={() => setHighlightedNpcId(npc.id)}
              onBlur={() =>
                setHighlightedNpcId((current) =>
                  current === npc.id ? null : current
                )
              }
              aria-label={`${presentation.displayName}, ${presentation.role}와 대화하기`}
            >
              <NpcNameTag
                displayName={presentation.displayName}
                displayRole={presentation.baseCampDisplayRole}
              />
              {questMarker !== "none" && (
                <NpcQuestMarker
                  displayName={presentation.displayName}
                  marker={questMarker}
                />
              )}
            </button>
          );
        })}
        {map.interactionRegions.map((region) =>
          region.id === "dungeonEntrance" ? (
            <DungeonEntranceButton
              key={region.id}
              region={region}
              disabled={mode === "story" || interactionsDisabled}
              selected={selectedRegionId === region.id}
              onClick={() => onSelectRegion(region)}
              onHighlightChange={setDungeonEntranceHighlighted}
            />
          ) : (
          <button
            key={region.id}
            type="button"
            className={`base-camp-interaction-region region-${region.id} ${
              selectedRegionId === region.id ? "is-selected" : ""
            }`}
            style={{
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height,
            }}
            disabled={mode === "story" || interactionsDisabled}
            onClick={() => onSelectRegion(region)}
            aria-label={`${region.label} 개발용 클릭 영역`}
          >
            <span
              className="base-camp-dev-marker"
              style={{
                left: (region.markerX ?? region.x) - region.x,
                top: (region.markerY ?? region.y) - region.y,
              }}
            >
              개발용
              <small>{region.id}</small>
            </span>
          </button>
          ),
        )}
      </div>
      <div
        className="base-camp-layer highlight-layer"
        style={{ zIndex: BASE_CAMP_LAYER.highlight }}
        aria-hidden="true"
      >
        {highlightedRegion && (
          <span
            className="base-camp-target-highlight"
            style={{
              left: highlightedRegion.x,
              top: highlightedRegion.y,
              width: highlightedRegion.width,
              height: highlightedRegion.height,
            }}
          />
        )}
        {selectedRegionId && selectedRegionId !== "dungeonEntrance" && (
          <span className="base-camp-highlight-label">
            선택: {selectedRegionId}
          </span>
        )}
      </div>
      {import.meta.env.DEV && (
        <output
          className="base-camp-layer-debug"
          style={{ zIndex: BASE_CAMP_LAYER.debug }}
          aria-live="polite"
        >
          {LAYER_ORDER.map((layerName) => {
            const state = layerLoadStates[layerName];
            return (
              <span key={layerName}>
                {layerName}: {state.status}
                {state.naturalWidth && state.naturalHeight
                  ? ` ${state.naturalWidth}×${state.naturalHeight}`
                  : ""}
              </span>
            );
          })}
        </output>
      )}
    </div>
  );
}
