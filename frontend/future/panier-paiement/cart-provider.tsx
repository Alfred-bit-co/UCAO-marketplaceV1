"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart-types";
import type { Product, Profile } from "@/lib/types";

export type ReceiptItem = CartItem & {
  lineTotal: number;
};

export type Receipt = {
  orderId: string;
  buyerName: string;
  items: ReceiptItem[];
  total: number;
  createdAt: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  receipt: Receipt | null;
  isCartOpen: boolean;
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setReceipt: (receipt: Receipt | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ucao-marketplace-cart";

function toCartItem(product: Product): CartItem {
  return {
    productId: String(product.id),
    name: product.name,
    price: product.price,
    quantity: 1,
    category: product.category,
    imageUrl: product.image_url,
    sellerName: product.seller?.name || "Vendeur UCAO",
    sellerId: product.user_id,
  };
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.productId && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function buildReceipt(orderId: string, buyer: Profile | null, items: CartItem[]): Receipt {
  const receiptItems = items.map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity,
  }));

  return {
    orderId,
    buyerName: buyer?.full_name || "Acheteur UCAO",
    items: receiptItems,
    total: receiptItems.reduce((sum, item) => sum + item.lineTotal, 0),
    createdAt: new Date().toISOString(),
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((product: Product) => {
    const nextItem = toCartItem(product);
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.productId === nextItem.productId);
      if (existing) {
        return currentItems.map((item) =>
          item.productId === nextItem.productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...currentItems, nextItem];
    });
    setReceipt(null);
    setIsCartOpen(true);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    return {
      items,
      count,
      total,
      receipt,
      isCartOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      setReceipt,
    };
  }, [addItem, clearCart, isCartOpen, items, receipt, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
