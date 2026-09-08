import { DEMO_STANDS } from "./constants";
import { createClient, isSupabaseConfigured } from "./supabase";
import { getPublicProfiles, toSeller, type PublicProfile } from "./public-profiles";
import type { PaginatedResult, Product, Stand } from "./types";
import { escapeIlike } from "./utils";

type StandRow = {
  id: string;
  name: string;
  description: string;
  banner_url: string | null;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  products?: { id: string; category: string }[] | null;
};

const STAND_SELECT = "*, products(id, category)";

function mapStand(row: StandRow, profile?: PublicProfile): Stand {
  const tier = profile?.subscription_tier ?? null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    banner_url: row.banner_url,
    user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    seller: toSeller(profile),
    seller_tier: tier,
    products: (row.products ?? []) as unknown as Product[],
  };
}

export async function getStands(pageOrOptions: number | { page?: number; perPage?: number; search?: string; category?: string } = 1, legacyPerPage = 12): Promise<PaginatedResult<Stand>> {
  const options = typeof pageOrOptions === "number" ? { page: pageOrOptions, perPage: legacyPerPage } : pageOrOptions;
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 12;
  if (!isSupabaseConfigured()) {
    const start = (page - 1) * perPage;
    const items = DEMO_STANDS.slice(start, start + perPage);
    return { items, page, pages: Math.max(Math.ceil(DEMO_STANDS.length / perPage), 1), total: DEMO_STANDS.length };
  }

  const supabase = createClient();
  if (!supabase) return { items: DEMO_STANDS, page: 1, pages: 1, total: DEMO_STANDS.length };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  let query = supabase
    .from("stands")
    .select(STAND_SELECT, { count: "exact" })
    .eq("status", "approved")
  if (options.search?.trim()) {
    const term = escapeIlike(options.search.trim());
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (options.category && options.category !== "tous") query = query.eq("products.category", options.category);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error || !data) {
    console.error("SUPABASE ERROR (getStands):", error);
    const items = DEMO_STANDS.slice(from, to + 1);
    return { items, page, pages: Math.max(Math.ceil(DEMO_STANDS.length / perPage), 1), total: DEMO_STANDS.length };
  }

  const total = count ?? data.length;
  return {
    items: await mapStands(data as unknown as StandRow[]),
    page,
    pages: Math.max(Math.ceil(total / perPage), 1),
    total,
  };
}

export async function getStandById(id: string): Promise<Stand | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;
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
    return null;
  }
  return (await mapStands([data as unknown as StandRow]))[0] ?? null;
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
  return mapStands(data as unknown as StandRow[]);
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
  return { stand: (await mapStands([data as unknown as StandRow]))[0] ?? null, error: null };
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
  return mapStands(data as unknown as StandRow[]);
}

export async function updateStandStatus(standId: string, status: "approved" | "rejected"): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.from("stands").update({ status }).eq("id", standId);
  if (error) console.error("SUPABASE ERROR (updateStandStatus):", error);
  return !error;
}

async function mapStands(rows: StandRow[]): Promise<Stand[]> {
  const profiles = await getPublicProfiles(rows.map((row) => row.user_id));
  return rows.map((row) => mapStand(row, profiles.get(row.user_id)));
}
