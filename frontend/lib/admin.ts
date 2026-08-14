import { createClient, isSupabaseConfigured } from "./supabase";
import { PAYMENT_API_URL } from "./constants";
import type { Profile } from "./types";

export type MonthlySignup = { month: string; count: number };

export async function getVendorSignupsByMonth(): Promise<MonthlySignup[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("vendor_signups_monthly").select("*");
  if (error || !data) {
    console.error("SUPABASE ERROR (getVendorSignupsByMonth):", error);
    return [];
  }
  return data
    .map((row: { month: string; new_vendors: number }) => ({ month: row.month, count: Number(row.new_vendors) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  let request = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
  if (query.trim()) {
    request = request.or(`full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`);
  }
  const { data, error } = await request;
  if (error || !data) {
    console.error("SUPABASE ERROR (searchProfiles):", error);
    return [];
  }
  return data as Profile[];
}

export async function deleteUserAccount(userId: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configuré." };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: "Vous devez être connecté." };

  try {
    const response = await fetch(`${PAYMENT_API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, message: data?.error || `Erreur (code ${response.status}).` };
    }
    return { ok: true };
  } catch (err) {
    console.error("ADMIN ERROR (deleteUserAccount):", err);
    return { ok: false, message: "Impossible de contacter le serveur." };
  }
}