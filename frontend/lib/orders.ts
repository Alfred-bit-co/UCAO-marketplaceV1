import { createClient, isSupabaseConfigured } from "./supabase";
import type { Order } from "./types";

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Order[];
}
