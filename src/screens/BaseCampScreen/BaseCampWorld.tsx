import { useState } from "react";
import type {
  BaseCampInteractionRegion,
  BaseCampMapDefinition,
  BaseCampMode,
} from "../../types/baseCamp";
import { NPC_DEFINITIONS } from "../../game/npc/npcDefinitions";
import type { NpcDefinition } from "../../game/npc/npcTypes";
import { NpcIdleSprite } from "../../components/NpcIdleSprite";

type BaseCampWorldProps = {
  map: BaseCampMapDefinition;
  mode: BaseCampMode;
  selectedRegionId: string | null;
  onSelectRegion: (region: BaseCampInteractionRegion) => void;
  highlightTargetId?: string | null;
  selectedNpcId?: string | null;
  onSelectNpc?: (npc: NpcDefinition) => void;
  interactionsDisabled?: boolean;
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
}: BaseCampWorldProps) {
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
      <div className="base-camp-layer background-layer" aria-hidden="true">
        {renderLayerImage("background")}
      </div>
      <div className="base-camp-layer ground-layer" aria-hidden="true">
        {renderLayerImage("ground")}
      </div>
      <div className="base-camp-layer dungeon-entrance-layer" aria-hidden="true">
        {renderLayerImage("dungeonEntrance")}
      </div>
      <div className="base-camp-layer npc-layer">
        {NPC_DEFINITIONS.map((npc) => (
          <NpcIdleSprite
            key={npc.id}
            npc={npc}
            disabled={mode === "story" || interactionsDisabled}
            selected={selectedNpcId === npc.id}
            onSelect={(selectedNpc) => onSelectNpc?.(selectedNpc)}
          />
        ))}
      </div>
      <div className="base-camp-layer foreground-layer" aria-hidden="true">
        {renderLayerImage("foreground")}
      </div>
      <div
        className={`base-camp-layer interaction-layer ${
          mode === "story" || interactionsDisabled ? "is-disabled" : ""
        }`}
      >
        {map.interactionRegions.map((region) => (
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
            {region.id !== "dungeonEntrance" && (
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
            )}
          </button>
        ))}
      </div>
      <div className="base-camp-layer highlight-layer" aria-hidden="true">
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
        {selectedRegionId && (
          <span className="base-camp-highlight-label">
            선택: {selectedRegionId}
          </span>
        )}
      </div>
      {import.meta.env.DEV && (
        <output className="base-camp-layer-debug" aria-live="polite">
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
