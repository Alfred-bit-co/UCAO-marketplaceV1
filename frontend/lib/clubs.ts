import { createClient, isSupabaseConfigured } from "./supabase";
import type { Club } from "./types";

export async function getClubs(): Promise<Club[]> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from("clubs").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Club[];
}

export async function createClub(payload: Pick<Club, "name" | "banner_url" | "external_url"> & { short_description?: string }): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "Supabase non configure." };
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("clubs").insert({ ...payload, created_by: user?.id });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteClub(id: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("clubs").delete().eq("id", id);
  return !error;
}
