import { createClient, isSupabaseConfigured } from "./supabase";

/**
 * Administrateurs nommés par le propriétaire du site.
 *
 * Le propriétaire est le compte dont le rôle est ADMIN. Un admin nommé garde son rôle
 * (acheteur ou vendeur) et reçoit une permission à part. Toutes les vérifications sont faites
 * par la base : ici, on transmet seulement les demandes et on traduit les refus.
 */

export type PlatformAdmin = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  added_at: string;
};

export type AdminAuditEntry = {
  id: number;
  action: "granted" | "revoked";
  target_email: string | null;
  target_name: string | null;
  created_at: string;
};

type ErrorLike = { message?: string | null; code?: string | null } | null | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Vrai si la fonction SQL n'existe pas encore (le fichier PROPOSITION n'a pas été lancé). */
export function isAdminTeamUnavailable(error: ErrorLike): boolean {
  return error?.code === "PGRST202" || error?.code === "42883";
}

/** Traduit un refus de la base en français simple. */
export function friendlyAdminTeamError(error: ErrorLike): string {
  const message = error?.message ?? "";
  if (message.includes("USER_NOT_FOUND")) return "Aucun compte n'utilise cet e-mail. La personne doit d'abord créer son compte sur le site.";
  if (message.includes("EMAIL_NOT_CONFIRMED")) return "Cette personne n'a pas encore confirmé son adresse e-mail. Demandez-lui d'ouvrir le lien reçu, puis réessayez.";
  if (message.includes("ACCOUNT_SUSPENDED")) return "Ce compte est suspendu : réactivez-le avant de le nommer administrateur.";
  if (message.includes("ALREADY_OWNER")) return "Ce compte est déjà le propriétaire du site.";
  if (error?.code === "42501") return "Seul le propriétaire du site peut gérer les administrateurs.";
  if (isAdminTeamUnavailable(error)) return "Cette fonction n'est pas encore activée : lancez d'abord le fichier SQL dans Supabase.";
  return "Action impossible pour le moment. Réessayez dans quelques instants.";
}

/** Vrai pour le propriétaire et pour un admin nommé. Faux si la base ne connaît pas encore cette fonction. */
export async function amIAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("am_i_admin");
  if (error) {
    if (!isAdminTeamUnavailable(error)) console.error("SUPABASE ERROR (amIAdmin):", error);
    return false;
  }
  return data === true;
}

export async function listPlatformAdmins(): Promise<{ admins: PlatformAdmin[]; error: string | null; unavailable: boolean }> {
  const supabase = createClient();
  if (!supabase) return { admins: [], error: "Le service est momentanément indisponible. Réessayez dans quelques minutes.", unavailable: false };
  const { data, error } = await supabase.rpc("owner_list_admins");
  if (error) return { admins: [], error: friendlyAdminTeamError(error), unavailable: isAdminTeamUnavailable(error) };
  return { admins: (data as unknown as PlatformAdmin[]) ?? [], error: null, unavailable: false };
}

export async function listAdminAudit(): Promise<AdminAuditEntry[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("owner_list_admin_audit");
  if (error) return [];
  return (data as unknown as AdminAuditEntry[]) ?? [];
}

export async function setPlatformAdmin(email: string, enabled: boolean): Promise<{ error: string | null; name: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Le service est momentanément indisponible. Réessayez dans quelques minutes.", name: null };
  const cleanEmail = email.trim();
  if (!EMAIL_PATTERN.test(cleanEmail)) return { error: "Adresse e-mail invalide.", name: null };
  const { data, error } = await supabase.rpc("owner_set_admin", { p_email: cleanEmail, p_enabled: enabled });
  if (error) {
    console.error("SUPABASE ERROR (setPlatformAdmin):", error);
    return { error: friendlyAdminTeamError(error), name: null };
  }
  return { error: null, name: (data as { full_name?: string | null } | null)?.full_name ?? null };
}
