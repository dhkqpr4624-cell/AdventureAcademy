import { useState } from "react";
import { getItemDefinition } from "../game/inventory/itemDefinitions";
import { getItemQuantity, type InventoryState } from "../game/inventory/inventoryState";

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
  const selectedEquipment = selectedEquipmentId ? getItemDefinition(selectedEquipmentId) : null;
  const selectedSlot = selectedEquipment?.type === "weaponSkin" || selectedEquipment?.type === "armor"
    ? selectedEquipment.type
    : null;
  const selectedIsEquipped = Boolean(
    selectedSlot && inventory.equippedItemIds[selectedSlot] === selectedEquipmentId,
  );
  return (
    <div className="pixel-popup-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="pixel-rpg-popup inventory-popup" role="dialog" aria-modal="true" aria-labelledby="inventory-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><p className="eyebrow">ITEM</p><h2 id="inventory-title">인벤토리</h2><button type="button" onClick={onClose} aria-label="인벤토리 닫기">×</button></header>
        <div className="inventory-scroll">
          {itemIds.length === 0 && <p className="empty-popup-message">보유한 아이템이 없습니다.</p>}
          {itemIds.map((itemId) => {
            const item = getItemDefinition(itemId);
            if (!item) return null;
            return (
              <button
                key={itemId}
                type="button"
                className={`inventory-item rarity-${item.rarity}`}
                aria-label={`${item.name} ${getItemQuantity(inventory, itemId)}개. ${item.description}`}
                onClick={() => {
                  if (item.type === "weaponSkin" || item.type === "armor") {
                    setSelectedEquipmentId(itemId);
                  }
                }}
              >
                <span className="item-icon" aria-hidden="true">{item.icon}</span>
                <span><strong>{item.name}</strong><small>{item.type}</small></span>
                <b>×{getItemQuantity(inventory, itemId)}</b>
                <span className="item-tooltip" role="tooltip">{item.description}</span>
              </button>
            );
          })}
        </div>
        <footer className="inventory-gold"><span>Gold</span><strong>{Math.max(0, Math.floor(gold))} G</strong></footer>
      </section>
      {selectedEquipment && selectedSlot && (
        <div className="pixel-popup-backdrop" role="presentation" onMouseDown={() => setSelectedEquipmentId(null)}>
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
              <button type="button" onClick={() => setSelectedEquipmentId(null)} aria-label="장비 메뉴 닫기">×</button>
            </header>
            <div className="button-group">
              <button
                type="button"
                onClick={() => {
                  onEquipmentChange(selectedSlot, selectedIsEquipped ? null : selectedEquipment.id);
                  setSelectedEquipmentId(null);
                }}
              >
                {selectedIsEquipped ? "장착 해제하기" : "장착하기"}
              </button>
              <button type="button" onClick={() => setSelectedEquipmentId(null)}>취소</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
