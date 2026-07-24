import type { ProductCategory } from "./types";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  imageUrl?: string | null;
  sellerName: string;
  sellerId?: string;
};
