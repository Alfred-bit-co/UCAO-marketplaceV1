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

export async function updateCurrentProfile(payload: {
  full_name: string;
  phone: string;
}): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Supabase non configuré." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const fullName = payload.full_name.trim();
  const phone = payload.phone.trim();
  if (fullName.length < 2) return { error: "Le nom complet est obligatoire." };
  if (!phone) return { error: "Le numéro de téléphone est obligatoire." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) {
    console.error("SUPABASE ERROR (updateCurrentProfile):", error);
    return { error: error.message };
  }
  return { error: null };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}