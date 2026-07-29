import { getItemDefinition } from "../game/inventory/itemDefinitions";
import { getItemQuantity, type InventoryState } from "../game/inventory/inventoryState";

export function InventoryPopup({
  inventory, gold, onClose,
}: { inventory: InventoryState; gold: number; onClose: () => void }) {
  const itemIds = Object.keys(inventory.items).filter((id) => getItemQuantity(inventory, id) > 0);
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
              <button key={itemId} type="button" className={`inventory-item rarity-${item.rarity}`} aria-label={`${item.name} ${getItemQuantity(inventory, itemId)}개. ${item.description}`}>
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
    </div>
  );
}
