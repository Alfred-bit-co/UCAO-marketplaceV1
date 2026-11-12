import { STORAGE_BUCKET } from "./constants";
import { createClient, isSupabaseConfigured } from "./supabase";
import type { Club, ClubAnnouncement, ClubManager, ClubSession, DeletedClub } from "./types";
import { isValidPhoneNumber, normalizeWhatsAppNumber } from "./utils";

/**
 * Lectures et écritures des clubs (tables clubs, club_sessions, club_announcements et
 * fonctions RPC). La base protège tout par RLS : ici on ne fait que transmettre et
 * traduire les refus en messages clairs (friendlyClubError).
 */

type Result<T> = { data: T; error: null } | { data: null; error: string };

type SupabaseErrorLike = { message?: string | null; code?: string | null; details?: string | null; hint?: string | null } | null | undefined;

const NOT_CONFIGURED = "Supabase n'est pas configuré.";

/** Traduit une erreur Supabase (RPC, RLS, contraintes) en français simple. */
export function friendlyClubError(error: SupabaseErrorLike): string {
  if (!error) return "Une erreur inattendue s'est produite. Réessayez.";
  const message = error.message ?? "";
  const code = error.code ?? "";
  const details = `${message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (message.includes("NAME_TAKEN")) return "Un club actif porte déjà ce nom. Renommez-le ou supprimez-le d'abord.";
  if (message.includes("COLOR_TAKEN")) return "Cette couleur est déjà utilisée par un autre club. Choisissez-en une autre.";
  if (message.includes("USER_NOT_FOUND")) {
    return "Aucun compte n'utilise cet e-mail. Le représentant doit d'abord créer son compte sur la plateforme.";
  }
  if (code === "23505") {
    if (details.includes("clubs_color_unique_alive")) return "Cette couleur est déjà utilisée par un autre club. Choisissez-en une autre.";
    if (details.includes("clubs_name_unique_alive")) return "Un club porte déjà ce nom.";
    return "Cette valeur existe déjà.";
  }
  if (code === "23514") {
    if (details.includes("whatsapp")) return "Numéro WhatsApp invalide. Format attendu : +22890123456.";
    if (details.includes("color")) return "Couleur invalide : choisissez-la dans la palette.";
    if (details.includes("time_order")) return "L'heure de fin doit être après l'heure de début.";
    if (details.includes("name_len")) return "Le nom doit faire entre 2 et 60 caractères.";
    if (details.includes("description")) return "La description ne doit pas dépasser 400 caractères.";
    if (details.includes("title")) return "Le titre doit faire entre 3 et 120 caractères.";
    if (details.includes("body")) return "Le texte doit faire entre 3 et 1500 caractères.";
    if (details.includes("location")) return "La précision du lieu ne doit pas dépasser 80 caractères.";
    if (details.includes("activity")) return "L'activité ne doit pas dépasser 80 caractères.";
    return "Une valeur saisie n'est pas acceptée. Vérifiez le formulaire.";
  }
  if (code === "42501" || details.includes("row-level security") || details.includes("accès refusé") || details.includes("permission denied")) {
    return "Vous n'avez pas le droit de faire cette action.";
  }
  if (details.includes("fonction de suppression ou de restauration")) {
    return "Utilisez le bouton Supprimer (ou Restaurer) : ce champ ne se modifie pas directement.";
  }
  if (details.includes("failed to fetch") || details.includes("network")) {
    return "Connexion internet instable : impossible de joindre le serveur.";
  }
  if (message.includes("Club introuvable") || message.includes("Seul un club déjà supprimé")) return message;
  return "Impossible d'enregistrer pour le moment. Réessayez dans quelques instants.";
}

// ===== Lectures =====

function mapClub(row: Record<string, unknown>): Club {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    short_description: (row.short_description as string | null) ?? null,
    banner_url: (row.banner_url as string | null) ?? null,
    external_url: (row.external_url as string | null) ?? null,
    color: String(row.color ?? "#546E7A"),
    whatsapp: (row.whatsapp as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: row.is_active !== false,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    deleted_at: (row.deleted_at as string | null) ?? null,
  };
}

/**
 * Clubs triés par ordre d'affichage puis par nom. La RLS décide de ce qui est visible :
 * le public ne voit que les clubs actifs, un gestionnaire voit aussi les clubs cachés.
 */
export async function getClubs(): Promise<Club[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("clubs").select("*").is("deleted_at", null).order("sort_order").order("name");
  if (error || !data) {
    console.error("SUPABASE ERROR (getClubs):", error);
    return [];
  }
  return (data as unknown as Record<string, unknown>[]).map(mapClub);
}

export async function getClubSessions(): Promise<ClubSession[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("club_sessions").select("*").order("day_of_week").order("start_time");
  if (error || !data) {
    console.error("SUPABASE ERROR (getClubSessions):", error);
    return [];
  }
  return data as unknown as ClubSession[];
}

export async function getClubAnnouncements(): Promise<ClubAnnouncement[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("club_announcements").select("*").order("created_at", { ascending: false });
  if (error || !data) {
    console.error("SUPABASE ERROR (getClubAnnouncements):", error);
    return [];
  }
  return data as unknown as ClubAnnouncement[];
}

/** Vrai pour un gestionnaire des clubs ou pour l'administrateur. */
export async function amIClubManager(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("am_i_club_manager");
  if (error) {
    console.error("SUPABASE ERROR (amIClubManager):", error);
    return false;
  }
  return data === true;
}

// ===== Clubs : écritures =====

export type ClubPayload = {
  name: string;
  short_description: string;
  banner_url: string | null;
  external_url: string;
  whatsapp: string;
  sort_order: number;
  color: string;
  is_active: boolean;
};

function cleanClubPayload(payload: ClubPayload): Result<Record<string, unknown>> {
  const name = payload.name.trim();
  if (name.length < 2 || name.length > 60) return { data: null, error: "Le nom doit faire entre 2 et 60 caractères." };
  const description = payload.short_description.trim();
  if (description.length > 400) return { data: null, error: "La description ne doit pas dépasser 400 caractères." };
  const rawPhone = payload.whatsapp.trim();
  const phone = rawPhone ? normalizeWhatsAppNumber(rawPhone) : null;
  if (rawPhone && (!phone || !isValidPhoneNumber(phone))) {
    return { data: null, error: "Numéro WhatsApp invalide. Format attendu : +22890123456." };
  }
  const external = payload.external_url.trim();
  if (external && !/^https?:\/\/\S+$/i.test(external)) return { data: null, error: "Le lien externe doit commencer par http:// ou https://." };
  return {
    data: {
      name,
      short_description: description || null,
      banner_url: payload.banner_url || null,
      external_url: external || null,
      whatsapp: phone,
      sort_order: Number.isFinite(payload.sort_order) ? Math.trunc(payload.sort_order) : 0,
      color: payload.color.trim().toUpperCase(),
      is_active: payload.is_active,
    },
    error: null,
  };
}

/** Crée un club. `id` peut être fourni (il sert au chemin de l'image envoyée avant l'enregistrement). */
export async function createClub(payload: ClubPayload, id?: string): Promise<Result<Club>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const clean = cleanClubPayload(payload);
  if (clean.error) return clean;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("clubs")
    .insert({ ...clean.data, ...(id ? { id } : {}), created_by: user?.id ?? null, updated_by: user?.id ?? null })
    .select("*")
    .single();
  if (error || !data) {
    console.error("SUPABASE ERROR (createClub):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: mapClub(data as unknown as Record<string, unknown>), error: null };
}

export async function updateClub(id: string, payload: ClubPayload): Promise<Result<Club>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const clean = cleanClubPayload(payload);
  if (clean.error) return clean;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("clubs")
    .update({ ...clean.data, updated_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    console.error("SUPABASE ERROR (updateClub):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: mapClub(data as unknown as Record<string, unknown>), error: null };
}

/** Interrupteur « Visible / Caché ». */
export async function setClubActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("clubs")
    .update({ is_active: isActive, updated_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("SUPABASE ERROR (setClubActive):", error);
    return { error: friendlyClubError(error) };
  }
  if (!data?.length) return { error: "Vous n'avez pas le droit de faire cette action." };
  return { error: null };
}

/** Suppression réversible (gestionnaire ou admin) : le club disparaît du site avec son programme et ses annonces. */
export async function deleteClub(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.rpc("delete_club", { p_club_id: id });
  if (error) {
    console.error("SUPABASE ERROR (deleteClub):", error);
    return { error: friendlyClubError(error) };
  }
  return { error: null };
}

// ===== Image d'un club =====

const CLUB_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const CLUB_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const CLUB_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

export function validateClubImage(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!CLUB_IMAGE_TYPES.includes(file.type) && !CLUB_IMAGE_EXTENSIONS.includes(extension)) return "Format accepté : JPG, PNG ou WebP.";
  if (file.size > CLUB_IMAGE_MAX_BYTES) return "L'image ne doit pas dépasser 3 Mo.";
  return null;
}

function clubImageExtension(file: File): "jpg" | "png" | "webp" {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (!file.type) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "png" || extension === "webp") return extension;
  }
  return "jpg";
}

/**
 * Envoie l'image d'un club dans le bucket marketplace-media, au chemin
 * clubs/<auth.uid()>/<club_id>-<horodatage>.<ext> : la règle de stockage n'autorise que les
 * chemins dont le 2e dossier est l'identifiant de l'utilisateur. Renvoie l'URL publique.
 */
export async function uploadClubImage(file: File, clubId: string): Promise<Result<string>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const invalid = validateClubImage(file);
  if (invalid) return { data: null, error: invalid };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Connectez-vous pour envoyer une image." };

  const path = `clubs/${user.id}/${clubId}-${Date.now()}.${clubImageExtension(file)}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) {
    console.error("STORAGE ERROR (uploadClubImage):", error);
    const detail = error.message.toLowerCase();
    if (detail.includes("row-level security") || detail.includes("not authorized") || detail.includes("permission")) {
      return { data: null, error: "Envoi refusé. Reconnectez-vous puis réessayez." };
    }
    return { data: null, error: "Impossible d'envoyer l'image pour le moment. Réessayez dans quelques instants." };
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { data: data.publicUrl, error: null };
}

// ===== Séances =====

export type SessionPayload = {
  club_id: string;
  day_of_week: number;
  /** HH:MM */
  start_time: string;
  end_time: string;
  location_detail: string;
  activity: string;
};

function cleanSessionPayload(payload: SessionPayload): Result<Record<string, unknown>> {
  if (!payload.club_id) return { data: null, error: "Choisissez un club." };
  if (payload.day_of_week < 1 || payload.day_of_week > 7) return { data: null, error: "Choisissez un jour de la semaine." };
  if (!/^\d{2}:\d{2}$/.test(payload.start_time) || !/^\d{2}:\d{2}$/.test(payload.end_time)) {
    return { data: null, error: "Indiquez une heure de début et une heure de fin." };
  }
  if (payload.end_time <= payload.start_time) return { data: null, error: "L'heure de fin doit être après l'heure de début." };
  const location = payload.location_detail.trim();
  const activity = payload.activity.trim();
  if (location.length > 80) return { data: null, error: "La précision du lieu ne doit pas dépasser 80 caractères." };
  if (activity.length > 80) return { data: null, error: "L'activité ne doit pas dépasser 80 caractères." };
  return {
    data: {
      club_id: payload.club_id,
      day_of_week: payload.day_of_week,
      start_time: `${payload.start_time}:00`,
      end_time: `${payload.end_time}:00`,
      location_detail: location || null,
      activity: activity || null,
    },
    error: null,
  };
}

export async function createClubSession(payload: SessionPayload): Promise<Result<ClubSession>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const clean = cleanSessionPayload(payload);
  if (clean.error) return clean;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("club_sessions")
    .insert({ ...clean.data, created_by: user?.id ?? null, updated_by: user?.id ?? null })
    .select("*")
    .single();
  if (error || !data) {
    console.error("SUPABASE ERROR (createClubSession):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: data as unknown as ClubSession, error: null };
}

export async function updateClubSession(id: string, payload: SessionPayload): Promise<Result<ClubSession>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const clean = cleanSessionPayload(payload);
  if (clean.error) return clean;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("club_sessions")
    .update({ ...clean.data, updated_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    console.error("SUPABASE ERROR (updateClubSession):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: data as unknown as ClubSession, error: null };
}

export async function deleteClubSession(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data, error } = await supabase.from("club_sessions").delete().eq("id", id).select("id");
  if (error) {
    console.error("SUPABASE ERROR (deleteClubSession):", error);
    return { error: friendlyClubError(error) };
  }
  if (!data?.length) return { error: "Vous n'avez pas le droit de faire cette action." };
  return { error: null };
}

// ===== Annonces =====

export type AnnouncementPayload = {
  /** null = tous les clubs */
  club_id: string | null;
  title: string;
  body: string;
  /** ISO 8601 ou null */
  event_at: string | null;
  is_pinned: boolean;
};

function cleanAnnouncementPayload(payload: AnnouncementPayload): Result<Record<string, unknown>> {
  const title = payload.title.trim();
  const body = payload.body.trim();
  if (title.length < 3 || title.length > 120) return { data: null, error: "Le titre doit faire entre 3 et 120 caractères." };
  if (body.length < 3 || body.length > 1500) return { data: null, error: "Le texte doit faire entre 3 et 1500 caractères." };
  if (payload.event_at && Number.isNaN(new Date(payload.event_at).getTime())) return { data: null, error: "Date de l'événement invalide." };
  return {
    data: { club_id: payload.club_id || null, title, body, event_at: payload.event_at || null, is_pinned: payload.is_pinned },
    error: null,
  };
}

export async function createClubAnnouncement(payload: AnnouncementPayload): Promise<Result<ClubAnnouncement>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const clean = cleanAnnouncementPayload(payload);
  if (clean.error) return clean;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("club_announcements")
    .insert({ ...clean.data, created_by: user?.id ?? null, updated_by: user?.id ?? null })
    .select("*")
    .single();
  if (error || !data) {
    console.error("SUPABASE ERROR (createClubAnnouncement):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: data as unknown as ClubAnnouncement, error: null };
}

export async function updateClubAnnouncement(id: string, payload: AnnouncementPayload): Promise<Result<ClubAnnouncement>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const clean = cleanAnnouncementPayload(payload);
  if (clean.error) return clean;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("club_announcements")
    .update({ ...clean.data, updated_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    console.error("SUPABASE ERROR (updateClubAnnouncement):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: data as unknown as ClubAnnouncement, error: null };
}

/** Suppression définitive d'une annonce. */
export async function deleteClubAnnouncement(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data, error } = await supabase.from("club_announcements").delete().eq("id", id).select("id");
  if (error) {
    console.error("SUPABASE ERROR (deleteClubAnnouncement):", error);
    return { error: friendlyClubError(error) };
  }
  if (!data?.length) return { error: "Vous n'avez pas le droit de faire cette action." };
  return { error: null };
}

// ===== Administration =====

export async function adminListDeletedClubs(): Promise<Result<DeletedClub[]>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase.rpc("admin_list_deleted_clubs");
  if (error) {
    console.error("SUPABASE ERROR (adminListDeletedClubs):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  const rows = (data as unknown as Record<string, unknown>[]) ?? [];
  return {
    data: rows.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      color: String(row.color ?? "#546E7A"),
      deleted_at: String(row.deleted_at ?? ""),
      deleted_by_name: (row.deleted_by_name as string | null) ?? null,
      sessions_count: Number(row.sessions_count ?? 0),
    })),
    error: null,
  };
}

/** Code renvoyé par admin_restore_club quand la restauration bute sur le nom ou la couleur. */
export type RestoreFailure = "NAME_TAKEN" | "COLOR_TAKEN" | "OTHER";

export async function adminRestoreClub(id: string, color?: string): Promise<{ error: string | null; failure: RestoreFailure | null }> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED, failure: "OTHER" };
  const { error } = await supabase.rpc("admin_restore_club", { p_club_id: id, p_color: color ?? null });
  if (error) {
    console.error("SUPABASE ERROR (adminRestoreClub):", error);
    const failure: RestoreFailure = error.message.includes("NAME_TAKEN") ? "NAME_TAKEN" : error.message.includes("COLOR_TAKEN") ? "COLOR_TAKEN" : "OTHER";
    return { error: friendlyClubError(error), failure };
  }
  return { error: null, failure: null };
}

/** Suppression définitive d'un club déjà supprimé (admin). */
export async function adminPurgeClub(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.rpc("admin_purge_club", { p_club_id: id });
  if (error) {
    console.error("SUPABASE ERROR (adminPurgeClub):", error);
    return { error: friendlyClubError(error) };
  }
  return { error: null };
}

export async function adminListClubManagers(): Promise<Result<ClubManager[]>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase.rpc("admin_list_club_managers");
  if (error) {
    console.error("SUPABASE ERROR (adminListClubManagers):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  return { data: ((data as unknown as ClubManager[]) ?? []), error: null };
}

export async function adminSetClubManager(email: string, enabled: boolean): Promise<Result<{ user_id: string; full_name: string | null; enabled: boolean }>> {
  const supabase = createClient();
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const cleanEmail = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return { data: null, error: "Adresse e-mail invalide." };
  const { data, error } = await supabase.rpc("admin_set_club_manager", { p_email: cleanEmail, p_enabled: enabled });
  if (error) {
    console.error("SUPABASE ERROR (adminSetClubManager):", error);
    return { data: null, error: friendlyClubError(error) };
  }
  const row = (data ?? {}) as { user_id?: string; full_name?: string | null; enabled?: boolean };
  return { data: { user_id: String(row.user_id ?? ""), full_name: row.full_name ?? null, enabled: Boolean(row.enabled) }, error: null };
}
