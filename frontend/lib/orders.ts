import { createClient, isSupabaseConfigured } from "./supabase";
import type { Order, ProductCategory } from "./types";

type OrderRow = {
  id: string;
  user_id: string;
  amount: number;
  status: Order["status"];
  fedapay_transaction_id?: string | null;
  created_at?: string;
  order_items?: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products?: {
      name: string;
      category: ProductCategory;
    } | null;
  }[];
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    user_id: row.user_id,
    amount: row.amount,
    status: row.status,
    fedapay_transaction_id: row.fedapay_transaction_id ?? undefined,
    created_at: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product: item.products
        ? {
            name: item.products.name,
            category: item.products.category,
          }
        : null,
    })),
  };
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_id, quantity, unit_price, products(name, category))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as OrderRow[]).map(mapOrder);
}
