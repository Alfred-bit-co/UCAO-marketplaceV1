"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartNavButton() {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      className="relative grid size-10 place-items-center rounded-ucao bg-ucao-navy-soft text-ucao-navy dark:bg-[#142b4a] dark:text-white"
      aria-label={`Ouvrir le panier, ${count} article(s)`}
      onClick={openCart}
    >
      <ShoppingCart size={20} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-ucao-red px-1 text-xs font-black text-white">
          {count}
        </span>
      )}
    </button>
  );
}
