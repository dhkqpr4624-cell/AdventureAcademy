import { getItemDefinition } from "../game/inventory/itemDefinitions";
import { getItemQuantity, type InventoryState } from "../game/inventory/inventoryState";
import { SHOP_PRODUCTS } from "../game/inventory/shopResolver";
import { ItemIcon } from "./ItemIcon";

export function ShopPopup({
  inventory, gold, message, onBuy, onClose,
}: {
  inventory: InventoryState; gold: number; message: string;
  onBuy: (itemId: string) => void; onClose: () => void;
}) {
  return (
    <div className="pixel-popup-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="pixel-rpg-popup shop-popup" role="dialog" aria-modal="true" aria-labelledby="shop-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><p className="eyebrow">THEO'S SHOP</p><h2 id="shop-title">보급품 상점</h2><button className="pixel-popup-close-button" type="button" onClick={onClose} aria-label="상점 닫기">×</button></header>
        <div className="shop-products">
          {SHOP_PRODUCTS.map((product) => {
            const item = getItemDefinition(product.itemId)!;
            const quantity = getItemQuantity(inventory, product.itemId);
            const capped = quantity >= product.maxQuantity;
            return (
              <article key={product.itemId}>
                <span className="item-icon"><ItemIcon item={item} /></span>
                <div><strong>{item.name}</strong><p>{item.description}</p><small>보유 {quantity} / 최대 {product.maxQuantity}</small></div>
                <button type="button" disabled={capped || gold < product.price} onClick={() => onBuy(product.itemId)}>{product.price} G</button>
              </article>
            );
          })}
        </div>
        <p className="shop-message" aria-live="polite">{message || "필요한 보급품을 선택해 주십시오."}</p>
        <footer className="inventory-gold"><span>Gold</span><strong>{Math.max(0, Math.floor(gold))} G</strong></footer>
      </section>
    </div>
  );
}
