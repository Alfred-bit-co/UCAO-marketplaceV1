import { createClient, isSupabaseConfigured } from "./supabase";
import { uploadStudentIdCard } from "./storage";
import type { Profile, VerificationStatus } from "./types";

/**
 * Messages levés par la fonction SQL `submit_student_verification`
 * (raise exception) -> texte affiché à l'étudiant. Le détail technique
 * reste dans la console (console.error), jamais dans l'interface.
 */
const VERIFICATION_ERRORS: Record<string, string> = {
  "Non authentifie": "Votre session a expiré. Reconnectez-vous puis réessayez.",
  "Chemin de carte invalide": "Le fichier envoyé n'est pas valide. Utilisez une photo JPG, PNG ou WebP.",
  "Carte introuvable": "L'envoi de la carte a échoué. Réessayez.",
  "Filiere et niveau requis": "La filière et le niveau d'étude sont obligatoires.",
  "Telephone invalide": "Numéro invalide. Utilisez le format international, par exemple +22890000000.",
  "Compte deja verifie": "Votre compte est déjà vérifié.",
};

function verificationErrorMessage(message: string): string {
  return VERIFICATION_ERRORS[message] ?? "Impossible d'envoyer votre demande. Réessayez plus tard.";
}

export async function submitStudentVerification(
  file: File,
  details: { phone?: string; fieldOfStudy: string; studyLevel: string },
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { error: "Supabase non configuré." };

  const uploaded = await uploadStudentIdCard(file);
  if (uploaded.error || !uploaded.path) return { error: uploaded.error ?? "Impossible d'envoyer la carte." };

  const { error } = await supabase.rpc("submit_student_verification", {
    p_url: uploaded.path,
    p_phone: details.phone || null,
    p_field_of_study: details.fieldOfStudy,
    p_study_level: details.studyLevel,
  });
  if (error) {
    console.error("SUPABASE ERROR (submitStudentVerification):", error);
    return { error: verificationErrorMessage(error.message) };
  }
  return { error: null };
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

  const { error } = await supabase.rpc("admin_set_verification", {
    p_user_id: userId,
    p_status: status,
    p_note: note ?? null,
  });

  if (error) {
    console.error("SUPABASE ERROR (setVerificationStatus):", error);
    return false;
  }
  return true;
}

/** Lien temporaire (5 min) vers une carte du bucket privé, réservé à l'admin. */
export async function getStudentIdSignedUrl(path: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: "Supabase non configuré." };
  const { data, error } = await supabase.storage.from("student-ids").createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return { url: null, error: error?.message ?? "Impossible d'ouvrir la carte." };
  return { url: data.signedUrl, error: null };
}