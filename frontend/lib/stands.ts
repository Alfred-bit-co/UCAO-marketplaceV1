import { DEMO_STANDS } from "./constants";
import { createClient, isSupabaseConfigured } from "./supabase";
import type { PaginatedResult, Stand, UserRole } from "./types";

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
  };
  products?: [];
};

function mapStand(row: StandRow): Stand {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    banner_url: row.banner_url,
    user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    seller: row.profiles ? { name: row.profiles.full_name, role: row.profiles.role } : null,
    seller_role: row.profiles?.role ?? "SIMPLE",
    products: [],
  };
}

export async function getStands(page = 1, perPage = 1): Promise<PaginatedResult<Stand>> {
  if (!isSupabaseConfigured()) {
    const start = (page - 1) * perPage;
    const items = DEMO_STANDS.slice(start, start + perPage);
    return { items, page, pages: DEMO_STANDS.length, total: DEMO_STANDS.length };
  }

  const supabase = createClient();
  if (!supabase) return { items: DEMO_STANDS, page: 1, pages: 1, total: DEMO_STANDS.length };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await supabase
    .from("stands")
    .select("*, profiles(full_name, role)", { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    const items = DEMO_STANDS.slice(from, to + 1);
    return { items, page, pages: DEMO_STANDS.length, total: DEMO_STANDS.length };
  }

  const total = count ?? data.length;
  return { items: (data as StandRow[]).map(mapStand), page, pages: Math.max(Math.ceil(total / perPage), 1), total };
}

export async function getStandById(id: string): Promise<Stand | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? DEMO_STANDS[0] ?? null;
  }

  const supabase = createClient();
  if (!supabase) return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;

  const { data, error } = await supabase
    .from("stands")
    .select("*, profiles(full_name, role)")
    .eq("id", id)
    .single();

  if (error || !data) return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;
  return mapStand(data as StandRow);
}

export async function getMyStands(userId: string): Promise<Stand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stands")
    .select("*, profiles(full_name, role)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as StandRow[]).map(mapStand);
}

export async function createStand(
  userId: string,
  payload: { name: string; description: string; banner_url?: string },
): Promise<Stand | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("stands")
    .insert({ ...payload, user_id: userId, status: "pending" })
    .select("*, profiles(full_name, role)")
    .single();

  if (error || !data) return null;
  return mapStand(data as StandRow);
}
