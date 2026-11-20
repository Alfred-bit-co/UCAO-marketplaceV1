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
  "Profession invalide": "Indiquez votre profession (2 à 80 caractères).",
  "Carte deja envoyee": "Vous avez déjà envoyé une carte d'étudiant : contactez l'administration pour changer de type de compte.",
};

function verificationErrorMessage(message: string): string {
  return VERIFICATION_ERRORS[message] ?? "Impossible d'envoyer votre demande. Réessayez plus tard.";
}

export async function submitStudentVerification(
  file: File,
  details: { phone?: string; fieldOfStudy: string; studyLevel: string },
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };
  const supabase = createClient();
  if (!supabase) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };

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

/** Personnel de l'UCAO : la profession remplace la carte. Vérifiée ensuite par un administrateur. */
export async function submitStaffVerification(profession: string, phone?: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };
  const supabase = createClient();
  if (!supabase) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };

  const { error } = await supabase.rpc("submit_staff_verification", { p_profession: profession, p_phone: phone || null });
  if (error) {
    console.error("SUPABASE ERROR (submitStaffVerification):", error);
    if (error.code === "PGRST202" || error.code === "42883") {
      return { error: "Cette option n'est pas encore disponible. Réessayez un peu plus tard." };
    }
    return { error: verificationErrorMessage(error.message) };
  }
  return { error: null };
}

/** Comptes en attente : carte d'étudiant envoyée, ou profession indiquée (personnel de l'UCAO). */
export async function getPendingVerifications(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const base = () => supabase.from("profiles").select("*").eq("verification_status", "pending");
  let { data, error } = await base()
    .or("student_id_url.not.is.null,profession.not.is.null")
    .order("created_at", { ascending: false });

  // Colonne « profession » absente (SQL pas encore lancé) : cartes seulement, comme avant.
  if (error) {
    ({ data, error } = await base().not("student_id_url", "is", null).order("created_at", { ascending: false }));
  }

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
  if (!supabase) return { url: null, error: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };
  const { data, error } = await supabase.storage.from("student-ids").createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return { url: null, error: "Impossible d'ouvrir la carte pour le moment. Rechargez la page, puis réessayez." };
  return { url: data.signedUrl, error: null };
}