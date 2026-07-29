import type { CSSProperties } from "react";
import type { ItemDefinition } from "../game/inventory/itemDefinitions";

export function ItemIcon({
  item,
  className = "",
}: {
  item: ItemDefinition;
  className?: string;
}) {
  return (
    <img
      className={`item-icon-image ${className}`.trim()}
      src={item.icon}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ "--item-icon-url": `url("${item.icon}")` } as CSSProperties}
    />
  );
}
