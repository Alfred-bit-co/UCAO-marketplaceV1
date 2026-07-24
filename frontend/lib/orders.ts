import { createClient, isSupabaseConfigured } from "./supabase";
import type { CartItem } from "./cart-types";
import type { Order, ProductCategory, Profile } from "./types";

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

type CheckoutResult =
  | {
      ok: true;
      orderId: string;
      buyer: Profile | null;
    }
  | {
      ok: false;
      message: string;
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

export async function checkoutCart(items: CartItem[]): Promise<CheckoutResult> {
  const validItems = items.filter((item) => item.quantity > 0);
  const amount = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!validItems.length || amount <= 0) {
    return { ok: false, message: "Votre panier est vide." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      orderId: `demo-${Date.now()}`,
      buyer: {
        id: "demo",
        full_name: "Acheteur UCAO",
        email: "",
        role: "ACHETEUR",
      },
    };
  }

  const supabase = createClient();
  if (!supabase) {
    return { ok: false, message: "La connexion Supabase est indisponible." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Connectez-vous pour valider votre commande." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      amount,
      status: "paid",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("SUPABASE ERROR (checkoutCart -> orders):", orderError);
    return { ok: false, message: "Impossible de créer la commande." };
  }

  const orderItems = validItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    console.error("SUPABASE ERROR (checkoutCart -> order_items):", itemsError);
    return { ok: false, message: "Commande créée, mais les articles n'ont pas pu être enregistrés." };
  }

  return {
    ok: true,
    orderId: order.id,
    buyer: profile
      ? {
          id: profile.id,
          full_name: profile.full_name,
          email: user.email ?? profile.email ?? "",
          role: profile.role,
          phone: profile.phone,
          subscription_tier: profile.subscription_tier,
          subscription_expires_at: profile.subscription_expires_at,
        }
      : {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || "Acheteur UCAO",
          email: user.email ?? "",
          role: "ACHETEUR",
        },
  };
} 