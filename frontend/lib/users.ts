import { SESSION_EXPIRED, friendlyError } from "./errors";
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
    field_of_study: data.field_of_study,
    study_level: data.study_level,
    subscription_tier: data.subscription_tier,
    subscription_activated_at: data.subscription_activated_at,
    subscription_expires_at: data.subscription_expires_at,
    verification_status: data.verification_status,
    student_id_url: data.student_id_url,
    verification_note: data.verification_note,
    cgu_accepted_at: data.cgu_accepted_at,
    account_type: data.account_type === "personnel" ? "personnel" : "etudiant",
    profession: data.profession ?? null,
    is_active: data.is_active,
    trial_ends_at: data.trial_ends_at,
    created_at: data.created_at,
  };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function updateProfile(
  userId: string,
  payload: { full_name?: string; phone?: string; field_of_study?: string; study_level?: string },
): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) {
    console.error("SUPABASE ERROR (updateProfile):", error);
    // 23505 = violation d'unicité : ce numéro appartient déjà à un autre compte (index profiles_phone_unique).
    const duplicate = `${error.message} ${error.details ?? ""}`.includes("profiles_phone_unique");
    if (error.code === "23505" && duplicate) {
      return { error: "Ce numéro est déjà utilisé par un autre compte." };
    }
    return { error: friendlyError(error, "Impossible d'enregistrer votre profil pour le moment. Réessayez dans quelques instants.") };
  }
  return { error: null };
}

export async function updateCurrentProfile(payload: { full_name: string }): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: SESSION_EXPIRED };

  return updateProfile(user.id, payload);
}

export async function changePassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("SUPABASE ERROR (changePassword):", error);
    const code = (error.code ?? "").toLowerCase();
    const text = (error.message ?? "").toLowerCase();
    if (code === "same_password" || text.includes("different from the old")) {
      return { error: "Le nouveau mot de passe doit être différent de l'ancien." };
    }
    if (code === "weak_password" || text.includes("password should") || text.includes("password is too")) {
      return { error: "Mot de passe trop faible : 8 caractères minimum, avec au moins un chiffre et un caractère spécial." };
    }
    if (code === "reauthentication_needed" || text.includes("reauthentication")) {
      return { error: "Par sécurité, déconnectez-vous puis reconnectez-vous avant de changer votre mot de passe." };
    }
    return { error: friendlyError(error, "Impossible de changer le mot de passe pour le moment. Réessayez dans quelques instants.") };
  }
  return { error: null };
}
