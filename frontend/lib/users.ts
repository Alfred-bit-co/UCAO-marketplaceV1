import { createClient, isSupabaseConfigured } from "./supabase";
import type { Profile, UserRole } from "./types";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !data) return null;

  return {
    id: data.id,
    full_name: data.full_name,
    email: user.email ?? data.email ?? "",
    role: data.role,
    phone: data.phone,
    subscription_tier: data.subscription_tier,
    subscription_expires_at: data.subscription_expires_at,
  };
}