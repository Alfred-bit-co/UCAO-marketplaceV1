"use client";

import Image from "next/image";
import { Minus, Plus, Printer, ShoppingCart, Trash2, X } from "lucide-react";
import { useState } from "react";
import { buildReceipt, useCart } from "./cart-provider";
import { checkoutCart } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    count,
    total,
    receipt,
    isCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    closeCart,
    setReceipt,
  } = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleCheckout() {
    setMessage(null);
    setIsCheckingOut(true);
    const result = await checkoutCart(items);
    setIsCheckingOut(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setReceipt(buildReceipt(result.orderId, result.buyer, items));
    clearCart();
    setMessage("Paiement confirmé. Votre reçu est prêt.");
  }

  return (
    <>
      {isCartOpen && <button className="fixed inset-0 z-40 bg-ucao-navy/50" type="button" aria-label="Fermer le panier" onClick={closeCart} />}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[430px] translate-x-full flex-col bg-white shadow-ucao transition-transform duration-300 dark:bg-[#0b1c31] ${
          isCartOpen ? "translate-x-0" : ""
        }`}
        aria-label="Panier"
      >
        <header className="flex items-center justify-between border-b border-ucao-line px-5 py-4 dark:border-[#263d5c]">
          <div>
            <p className="text-xs font-black uppercase text-ucao-red">Panier</p>
            <h2 className="text-2xl font-bold">{count} article(s)</h2>
          </div>
          <button type="button" className="grid size-10 place-items-center rounded-ucao bg-ucao-navy-soft text-ucao-navy dark:bg-[#142b4a] dark:text-white" onClick={closeCart} aria-label="Fermer le panier">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 && !receipt && (
            <div className="grid min-h-[260px] place-items-center text-center text-ucao-muted dark:text-[#a8b8cc]">
              <div>
                <ShoppingCart className="mx-auto mb-4 text-ucao-navy" size={42} />
                <p>Votre panier est vide pour le moment.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.productId} className="grid grid-cols-[82px_1fr] gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#10233b]">
                <div className="relative h-20 overflow-hidden rounded-ucao bg-white">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill sizes="82px" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-ucao-muted">
                      <ShoppingCart size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold leading-snug">{item.name}</h3>
                  <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{item.sellerName}</p>
                  <p className="font-black text-ucao-success">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-ucao bg-white dark:bg-[#0b1c31]">
                      <button type="button" className="grid size-8 place-items-center" onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label="Diminuer la quantité">
                        <Minus size={15} />
                      </button>
                      <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                      <button type="button" className="grid size-8 place-items-center" onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label="Augmenter la quantité">
                        <Plus size={15} />
                      </button>
                    </div>
                    <button type="button" className="grid size-8 place-items-center text-ucao-red" onClick={() => removeItem(item.productId)} aria-label="Retirer du panier">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {receipt && (
            <section className="mt-5 rounded-ucao border border-ucao-line bg-white p-5 dark:border-[#263d5c] dark:bg-[#10233b]" id="checkout-receipt">
              <p className="text-xs font-black uppercase text-ucao-red">Reçu de paiement</p>
              <h2 className="mb-2 text-2xl font-bold">Commande {receipt.orderId.slice(0, 8)}</h2>
              <p className="mb-4 text-sm text-ucao-muted dark:text-[#a8b8cc]">Nom et prénom de l&apos;acheteur : {receipt.buyerName}</p>
              <div className="space-y-3">
                {receipt.items.map((item) => (
                  <div key={item.productId} className="border-b border-ucao-line pb-3 text-sm last:border-0 dark:border-[#263d5c]">
                    <strong>{item.name}</strong>
                    <p>Vendeur : {item.sellerName}</p>
                    <p>
                      {item.quantity} x {formatPrice(item.price)} = {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-lg font-black">Total : {formatPrice(receipt.total)}</p>
              <p className="notice mt-4">
                Le vendeur ne livrera le produit qu&apos;à réception de ce reçu.
              </p>
              <button type="button" className="btn btn-ghost mt-3 w-full print:hidden" onClick={() => window.print()}>
                <Printer size={18} /> Imprimer ou enregistrer en PDF
              </button>
            </section>
          )}

          {message && <p className={`notice ${message.includes("confirmé") ? "" : "notice-error"}`}>{message}</p>}
        </div>

        <footer className="border-t border-ucao-line px-5 py-4 dark:border-[#263d5c]">
          <div className="mb-4 flex items-center justify-between text-lg font-black">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button type="button" className="btn btn-primary w-full" disabled={!items.length || isCheckingOut} onClick={handleCheckout}>
            {isCheckingOut ? "Validation..." : "Valider la commande"}
          </button>
        </footer>
      </aside>
    </>
  );
}
