import { DEMO_STANDS } from "./constants";
import { createClient, isSupabaseConfigured } from "./supabase";
import type { PaginatedResult, Product, Stand, SubscriptionTier, UserRole } from "./types";

type StandRow = {
  id: string;
  name: string;
  description: string;
  banner_url: string | null;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: {
    full_name: string;
    role: UserRole;
    phone: string | null;
    subscription_tier: SubscriptionTier | null;
  }[] | null;
  products?: { id: string; category: string }[] | null;
};

const STAND_SELECT = "*, profiles(full_name, role, phone, subscription_tier), products(id, category)";

function mapStand(row: StandRow): Stand {
  const profile = row.profiles?.[0] ?? null;
  const tier = profile?.subscription_tier ?? null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    banner_url: row.banner_url,
    user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    seller: profile
      ? {
          name: profile.full_name,
          role: profile.role,
          phone: profile.phone ?? undefined,
          subscription_tier: tier,
        }
      : null,
    seller_tier: tier,
    products: (row.products ?? []) as unknown as Product[],
  };
}

export async function getStands(page = 1, perPage = 10): Promise<PaginatedResult<Stand>> {
  if (!isSupabaseConfigured()) {
    const start = (page - 1) * perPage;
    const items = DEMO_STANDS.slice(start, start + perPage);
    return { items, page, pages: Math.max(Math.ceil(DEMO_STANDS.length / perPage), 1), total: DEMO_STANDS.length };
  }

  const supabase = createClient();
  if (!supabase) return { items: DEMO_STANDS, page: 1, pages: 1, total: DEMO_STANDS.length };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await supabase
    .from("stands")
    .select(STAND_SELECT, { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error("SUPABASE ERROR (getStands):", error);
    const items = DEMO_STANDS.slice(from, to + 1);
    return { items, page, pages: Math.max(Math.ceil(DEMO_STANDS.length / perPage), 1), total: DEMO_STANDS.length };
  }

  const total = count ?? data.length;
  return {
    items: (data as unknown as StandRow[]).map(mapStand),
    page,
    pages: Math.max(Math.ceil(total / perPage), 1),
    total,
  };
}

export async function getStandById(id: string): Promise<Stand | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? DEMO_STANDS[0] ?? null;
  }

  const supabase = createClient();
  if (!supabase) return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (getStandById):", error);
    return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;
  }
  return mapStand(data as unknown as StandRow);
}

export async function getMyStands(userId: string): Promise<Stand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("SUPABASE ERROR (getMyStands):", error);
    return [];
  }
  return (data as unknown as StandRow[]).map(mapStand);
}

export async function createStand(
  userId: string,
  payload: { name: string; description: string; banner_url?: string },
): Promise<{ stand: Stand | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { stand: null, error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { stand: null, error: "Supabase non configuré." };

  const { data, error } = await supabase
    .from("stands")
    .insert({ ...payload, user_id: userId, status: "pending" })
    .select(STAND_SELECT)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (createStand):", error);
    return { stand: null, error: error?.message ?? "Erreur inconnue." };
  }
  return { stand: mapStand(data as unknown as StandRow), error: null };
}

export async function getAllStandsForAdmin(): Promise<Stand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("SUPABASE ERROR (getAllStandsForAdmin):", error);
    return [];
  }
  return (data as unknown as StandRow[]).map(mapStand);
}

export async function updateStandStatus(standId: string, status: "approved" | "rejected"): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.from("stands").update({ status }).eq("id", standId);
  if (error) console.error("SUPABASE ERROR (updateStandStatus):", error);
  return !error;
}
