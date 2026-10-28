import { DEMO_STANDS } from "./constants";
import { createClient, isSupabaseConfigured } from "./supabase";
import { getPublicProfiles, toSeller, type PublicProfile } from "./public-profiles";
import { isStandCategory, modesNeedPhone, normalizeWhatsAppPhone, sanitizeContactModes } from "./stand-catalog";
import type { PaginatedResult, Stand } from "./types";
import { escapeIlike } from "./utils";

type StandRow = {
  id: string;
  name: string;
  description: string;
  banner_url: string | null;
  logo_url: string | null;
  category: string | null;
  whatsapp_phone: string | null;
  contact_modes: string[] | null;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

/** Champs modifiables par le vendeur. Le statut et le propriétaire ne le sont jamais (protégés côté base). */
export type StandPayload = {
  name: string;
  description: string;
  banner_url?: string | null;
  logo_url?: string | null;
  category?: string;
  whatsapp_phone?: string | null;
  contact_modes?: string[];
};

// Un stand n'embarque plus ses produits : la page d'un stand ne montre que sa vitrine et ses boutons WhatsApp.
const STAND_SELECT = "*";

function mapStand(row: StandRow, profile?: PublicProfile): Stand {
  const tier = profile?.subscription_tier ?? null;
  const seller = toSeller(profile);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    banner_url: row.banner_url,
    logo_url: row.logo_url,
    category: isStandCategory(row.category) ? row.category : "autres",
    whatsapp_phone: row.whatsapp_phone,
    contact_modes: sanitizeContactModes(row.contact_modes),
    user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    // Le téléphone personnel du vendeur n'est jamais exposé par un stand : seul le numéro du stand l'est.
    seller: seller ? { ...seller, phone: undefined } : seller,
    seller_tier: tier,
  };
}

/** Valide et nettoie les champs saisis par le vendeur. */
function cleanPayload(payload: StandPayload) {
  const rawPhone = payload.whatsapp_phone?.trim() ?? "";
  const phone = rawPhone ? normalizeWhatsAppPhone(rawPhone) : null;
  if (rawPhone && !phone) {
    return { ok: false, error: "Numéro WhatsApp invalide. Format attendu : +22890123456 (indicatif du pays puis numéro)." } as const;
  }
  const modes = sanitizeContactModes(payload.contact_modes);
  if (modesNeedPhone(modes) && !phone) {
    return { ok: false, error: "Ajoutez un numéro WhatsApp pour proposer les boutons Commander, Réserver ou Rendez-vous." } as const;
  }
  return {
    ok: true,
    data: {
      name: payload.name.trim(),
      description: payload.description.trim(),
      banner_url: payload.banner_url || null,
      logo_url: payload.logo_url || null,
      category: isStandCategory(payload.category) ? payload.category : "autres",
      whatsapp_phone: phone,
      contact_modes: modes,
    },
  } as const;
}

export async function getStands(pageOrOptions: number | { page?: number; perPage?: number; search?: string; category?: string } = 1, legacyPerPage = 12): Promise<PaginatedResult<Stand>> {
  const options = typeof pageOrOptions === "number" ? { page: pageOrOptions, perPage: legacyPerPage } : pageOrOptions;
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 12;
  if (!isSupabaseConfigured()) {
    const start = (page - 1) * perPage;
    const items = DEMO_STANDS.slice(start, start + perPage);
    return { items, page, pages: Math.max(Math.ceil(DEMO_STANDS.length / perPage), 1), total: DEMO_STANDS.length };
  }

  const supabase = createClient();
  if (!supabase) return { items: DEMO_STANDS, page: 1, pages: 1, total: DEMO_STANDS.length };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  let query = supabase
    .from("stands")
    .select(STAND_SELECT, { count: "exact" })
    .eq("status", "approved");
  if (options.search?.trim()) {
    const term = escapeIlike(options.search.trim());
    query = query.or("name.ilike.%" + term + "%,description.ilike.%" + term + "%");
  }
  if (isStandCategory(options.category)) query = query.eq("category", options.category);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error || !data) {
    // Page demandée au-delà de la dernière : ce n'est pas une panne.
    if (error?.code === "PGRST103") return { items: [], page, pages: 1, total: 0 };
    console.error("SUPABASE ERROR (getStands):", error);
    // Panne réelle : on le signale, on n'affiche JAMAIS de faux stands de démonstration en production.
    return { items: [], page, pages: 1, total: 0, unavailable: true };
  }

  const total = count ?? data.length;
  return {
    items: await mapStands(data as unknown as StandRow[]),
    page,
    pages: Math.max(Math.ceil(total / perPage), 1),
    total,
  };
}

/** Les derniers stands validés (bloc « Nouveaux stands »). */
export async function getLatestStands(limit = 3): Promise<Stand[]> {
  if (!isSupabaseConfigured()) return DEMO_STANDS.slice(0, limit);
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("SUPABASE ERROR (getLatestStands):", error);
    return [];
  }
  return mapStands(data as unknown as StandRow[]);
}

export async function getStandById(id: string): Promise<Stand | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;
  }

  const supabase = createClient();
  if (!supabase) return DEMO_STANDS.find((stand) => String(stand.id) === id) ?? null;

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (getStandById):", error);
    return null;
  }
  return (await mapStands([data as unknown as StandRow]))[0] ?? null;
}

export async function getMyStands(userId: string): Promise<Stand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("SUPABASE ERROR (getMyStands):", error);
    return [];
  }
  return mapStands(data as unknown as StandRow[]);
}

export async function createStand(
  userId: string,
  payload: StandPayload,
): Promise<{ stand: Stand | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { stand: null, error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { stand: null, error: "Supabase non configuré." };

  const clean = cleanPayload(payload);
  if (!clean.ok) return { stand: null, error: clean.error };

  const { data, error } = await supabase
    .from("stands")
    .insert({ ...clean.data, user_id: userId, status: "pending" })
    .select(STAND_SELECT)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (createStand):", error);
    return { stand: null, error: error?.message ?? "Erreur inconnue." };
  }
  return { stand: (await mapStands([data as unknown as StandRow]))[0] ?? null, error: null };
}

/** Modifie un stand du vendeur (nom, description, catégorie, images, WhatsApp, modes). Le statut reste inchangé. */
export async function updateMyStand(
  userId: string,
  standId: string,
  payload: StandPayload,
): Promise<{ stand: Stand | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { stand: null, error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { stand: null, error: "Supabase non configuré." };

  const clean = cleanPayload(payload);
  if (!clean.ok) return { stand: null, error: clean.error };

  const { data, error } = await supabase
    .from("stands")
    .update(clean.data)
    .eq("id", standId)
    .eq("user_id", userId)
    .select(STAND_SELECT)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (updateMyStand):", error);
    return { stand: null, error: error?.message ?? "Erreur inconnue." };
  }
  return { stand: (await mapStands([data as unknown as StandRow]))[0] ?? null, error: null };
}

export async function getAllStandsForAdmin(): Promise<Stand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stands")
    .select(STAND_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("SUPABASE ERROR (getAllStandsForAdmin):", error);
    return [];
  }
  return mapStands(data as unknown as StandRow[]);
}

export async function updateStandStatus(standId: string, status: "approved" | "rejected"): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.from("stands").update({ status }).eq("id", standId);
  if (error) console.error("SUPABASE ERROR (updateStandStatus):", error);
  return !error;
}

export async function deleteStandForAdmin(standId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { error: "Supabase non configuré." };

  const { data, error } = await supabase.from("stands").delete().eq("id", standId).select("id");
  if (error) {
    console.error("SUPABASE ERROR (deleteStandForAdmin):", error);
    return { error: error.message || "Impossible de supprimer ce stand." };
  }
  if (!data?.length) {
    return { error: "Suppression refusée : vérifiez que la migration des droits administrateur a été appliquée." };
  }
  return { error: null };
}

export async function deleteStand(userId: string, standId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { error: "Supabase non configuré." };

  const { error } = await supabase.from("stands").delete().eq("id", standId).eq("user_id", userId);
  if (error) {
    console.error("SUPABASE ERROR (deleteStand):", error);
    return { error: error.message || "Impossible de supprimer ce stand." };
  }
  return { error: null };
}

async function mapStands(rows: StandRow[]): Promise<Stand[]> {
  const profiles = await getPublicProfiles(rows.map((row) => row.user_id));
  return rows.map((row) => mapStand(row, profiles.get(row.user_id)));
}
