import { useState } from "react";
import { getItemDefinition } from "../game/inventory/itemDefinitions";
import { getItemQuantity, type InventoryState } from "../game/inventory/inventoryState";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";

const rarityLabel = (rarity: string) =>
  rarity.charAt(0).toUpperCase() + rarity.slice(1);

const tooltipContent = (item: NonNullable<ReturnType<typeof getItemDefinition>>) => {
  const lines = [item.name, rarityLabel(item.rarity)];
  if (item.type === "armor") {
    lines.push(`최대체력 +${item.equipmentStats?.maxHpBonus ?? 0}`);
  } else if (item.type === "weaponSkin") {
    lines.push("외형 전용 · 능력치 변화 없음");
  }
  lines.push(item.description);
  return lines.join("\n");
};

const INVENTORY_COLUMN_COUNT = 8;
const INVENTORY_MINIMUM_SLOT_COUNT = 32;

export function InventoryPopup({
  inventory, gold, onClose, onEquipmentChange,
}: {
  inventory: InventoryState;
  gold: number;
  onClose: () => void;
  onEquipmentChange: (slot: "weaponSkin" | "armor", itemId: string | null) => void;
}) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const itemIds = Object.keys(inventory.items).filter((id) => getItemQuantity(inventory, id) > 0);
  const slotCount = Math.max(
    INVENTORY_MINIMUM_SLOT_COUNT,
    Math.ceil(itemIds.length / INVENTORY_COLUMN_COUNT) * INVENTORY_COLUMN_COUNT,
  );
  const slots = Array.from({ length: slotCount }, (_, index) => itemIds[index] ?? null);
  const equippedItemIds = new Set(Object.values(inventory.equippedItemIds));
  const selectedEquipment = selectedEquipmentId
    ? getItemDefinition(selectedEquipmentId)
    : null;
  const selectedSlot =
    selectedEquipment?.type === "weaponSkin" || selectedEquipment?.type === "armor"
      ? selectedEquipment.type
      : null;
  const selectedIsEquipped = Boolean(
    selectedSlot &&
      inventory.equippedItemIds[selectedSlot] === selectedEquipmentId,
  );

  return (
    <div className="pixel-popup-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="pixel-rpg-popup inventory-popup" role="dialog" aria-modal="true" aria-labelledby="inventory-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><p className="eyebrow">ITEM</p><h2 id="inventory-title">인벤토리</h2><button className="pixel-popup-close-button" type="button" onClick={onClose} aria-label="인벤토리 닫기">×</button></header>
        <div className="inventory-scroll">
          <div className="inventory-grid" role="grid" aria-label="보유 아이템">
          {slots.map((itemId, index) => {
            if (!itemId) {
              return <span key={`empty-${index}`} className="inventory-slot is-empty" role="gridcell" aria-label="빈 슬롯" />;
            }
            const item = getItemDefinition(itemId);
            if (!item) return null;
            const quantity = getItemQuantity(inventory, itemId);
            const isEquipped = equippedItemIds.has(itemId);
            return (
              <ItemTooltip key={itemId} content={tooltipContent(item)}>
                {(bindings) => (
                  <button
                    type="button"
                    className={`inventory-slot rarity-${item.rarity}`}
                    aria-label={`${item.name} ${quantity}개${isEquipped ? ", 장착 중" : ""}. ${item.description}`}
                    onClick={() => {
                      if (item.type === "weaponSkin" || item.type === "armor") {
                        setSelectedEquipmentId(itemId);
                      }
                    }}
                    {...bindings}
                  >
                    <ItemIcon item={item} />
                    {isEquipped && <span className="inventory-equipped-mark" aria-hidden="true">✓</span>}
                    {item.stackable && quantity > 1 && <b className="inventory-stack-count">{quantity}</b>}
                  </button>
                )}
              </ItemTooltip>
            );
          })}
          </div>
        </div>
        <footer className="inventory-gold"><span>Gold</span><strong>{Math.max(0, Math.floor(gold))} G</strong></footer>
      </section>
      {selectedEquipment && selectedSlot && (
        <div
          className="pixel-popup-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedEquipmentId(null)}
        >
          <section
            className="pixel-rpg-popup"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedEquipment.name} 장비 메뉴`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <p className="eyebrow">EQUIPMENT</p>
              <h2>{selectedEquipment.name}</h2>
              <button
                className="pixel-popup-close-button"
                type="button"
                onClick={() => setSelectedEquipmentId(null)}
                aria-label="장비 메뉴 닫기"
              >
                ×
              </button>
            </header>
            <div className="button-group">
              <button
                type="button"
                onClick={() => {
                  onEquipmentChange(
                    selectedSlot,
                    selectedIsEquipped ? null : selectedEquipment.id,
                  );
                  setSelectedEquipmentId(null);
                }}
              >
                {selectedIsEquipped ? "장착 해제하기" : "장착하기"}
              </button>
              <button type="button" onClick={() => setSelectedEquipmentId(null)}>
                취소
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
