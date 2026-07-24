"use client";

import { ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { addItem } = useCart();

  return (
    <button type="button" className={cn("btn btn-primary", className)} onClick={() => addItem(product)}>
      <ShoppingCart size={18} /> Ajouter au panier
    </button>
  );
}
