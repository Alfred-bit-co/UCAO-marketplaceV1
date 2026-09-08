import { createClient, isSupabaseConfigured } from "./supabase";
import { uploadStudentIdCard } from "./storage";
import type { Profile, VerificationStatus } from "./types";

export async function submitStudentIdCard(file: File): Promise<{ error: string | null; path?: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { error: "Supabase non configuré." };

  const uploaded = await uploadStudentIdCard(file);
  if (uploaded.error || !uploaded.path) return { error: uploaded.error ?? "Impossible d'envoyer la carte." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour envoyer votre carte." };
  const { error } = await supabase
    .from("profiles")
    .update({ student_id_url: uploaded.path, verification_status: "pending" })
    .eq("id", user.id);
  if (error) {
    console.error("SUPABASE ERROR (submitStudentIdCard):", error);
    return { error: error.message };
  }
  return { error: null, path: uploaded.path };
}

export async function getPendingVerifications(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("verification_status", "pending")
    .not("student_id_url", "is", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("SUPABASE ERROR (getPendingVerifications):", error);
    return [];
  }
  return data as Profile[];
}

export async function setVerificationStatus(
  userId: string,
  status: VerificationStatus,
  note?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: status, verification_reviewed_at: new Date().toISOString(), verification_note: note ?? null })
    .eq("id", userId);

  if (error) {
    console.error("SUPABASE ERROR (setVerificationStatus):", error);
    return false;
  }
  return true;
}

export async function getStudentIdSignedUrl(path: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: "Supabase non configure." };
  const { data, error } = await supabase.storage.from("student-ids").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return { url: null, error: error?.message ?? "Impossible d'ouvrir la carte." };
  return { url: data.signedUrl, error: null };
}
