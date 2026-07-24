import type {
  BaseCampInteractionRegion,
  BaseCampMapDefinition,
  BaseCampMode,
} from "../../types/baseCamp";

type BaseCampWorldProps = {
  map: BaseCampMapDefinition;
  mode: BaseCampMode;
  selectedRegionId: string | null;
  onSelectRegion: (region: BaseCampInteractionRegion) => void;
};

export function BaseCampWorld({
  map,
  mode,
  selectedRegionId,
  onSelectRegion,
}: BaseCampWorldProps) {
  const layerStyle = {
    width: map.worldWidth,
    height: map.worldHeight,
  };

  return (
    <div
      className="base-camp-world"
      style={layerStyle}
      data-testid="BaseCampWorld"
    >
      <div className="base-camp-layer background-layer" aria-hidden="true">
        <img src={map.layers.background} alt="" draggable={false} />
      </div>
      <div className="base-camp-layer ground-layer" aria-hidden="true">
        <img src={map.layers.ground} alt="" draggable={false} />
      </div>
      <div className="base-camp-layer dungeon-entrance-layer" aria-hidden="true">
        <img src={map.layers.dungeonEntrance} alt="" draggable={false} />
      </div>
      <div className="base-camp-layer npc-layer" aria-hidden="true" />
      <div className="base-camp-layer foreground-layer" aria-hidden="true">
        <img src={map.layers.foreground} alt="" draggable={false} />
      </div>
      <div
        className={`base-camp-layer interaction-layer ${
          mode === "story" ? "is-disabled" : ""
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
            disabled={mode === "story"}
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
        {selectedRegionId && (
          <span className="base-camp-highlight-label">
            선택: {selectedRegionId}
          </span>
        )}
      </div>
    </div>
  );
}
