import { createClient, isSupabaseConfigured } from "./supabase";

export type LikeInfo = { count: number; liked: boolean };

export type ToggleResult =
  | { ok: true; liked?: boolean; count?: number }
  | { ok: false; reason: "login" | "own" | "limit" | "error" };

/**
 * Likes sur les produits.
 *
 * - Le nombre de likes est public (table product_stats, mise à jour par la base).
 * - Utilisateur connecté : ses likes sont dans product_likes (privée, un like par produit).
 * - Visiteur sans compte : un identifiant anonyme (UUID) est gardé dans le navigateur ;
 *   ses likes passent par les fonctions SQL toggle_visitor_like et get_visitor_likes.
 * - Les demandes de plusieurs cartes affichées en même temps sont regroupées
 *   (compteurs + mes likes) au lieu d'une requête par carte.
 */

const VISITOR_STORAGE_KEY = "ucao_visitor_id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SupabaseBrowserClient = NonNullable<ReturnType<typeof createClient>>;

const cache = new Map<string, LikeInfo>();
let queue = new Set<string>();
let pending: Promise<void> | null = null;
let listening = false;
// Secours si le navigateur interdit le stockage local (navigation privée stricte).
let memoryVisitorId: string | null = null;

function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // randomUUID n'existe que sur https ou localhost : secours pour un test en http sur le réseau local.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Identifiant anonyme du visiteur.
 * create = false : on lit seulement (on ne crée pas d'identifiant pour quelqu'un qui ne like jamais).
 */
function getVisitorId(create: boolean): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (stored && UUID_PATTERN.test(stored)) return stored;
  } catch {
    // stockage indisponible : on retombe sur la mémoire
  }

  if (memoryVisitorId) return memoryVisitorId;
  if (!create) return null;

  const id = newUuid();
  memoryVisitorId = id;
  try {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, id);
  } catch {
    // stockage indisponible : l'identifiant ne vivra que le temps de la page
  }
  return id;
}

function ensureAuthListener() {
  if (listening || typeof window === "undefined") return;
  const supabase = createClient();
  if (!supabase) return;
  listening = true;
  // Connexion / déconnexion : les "j'aime" mémorisés ne sont plus valables.
  supabase.auth.onAuthStateChange(() => {
    cache.clear();
  });
}

async function fetchInfo(ids: string[]) {
  const supabase = createClient();
  if (!supabase || ids.length === 0) return;

  const [statsResult, sessionResult] = await Promise.all([
    supabase.from("product_stats").select("product_id, like_count").in("product_id", ids),
    supabase.auth.getSession(),
  ]);

  if (statsResult.error) console.error("SUPABASE ERROR (likes, compteurs):", statsResult.error);

  const counts = new Map<string, number>();
  for (const row of (statsResult.data ?? []) as { product_id: string; like_count: number }[]) {
    counts.set(row.product_id, row.like_count);
  }

  const liked = new Set<string>();
  const userId = sessionResult.data.session?.user.id;

  if (userId) {
    const { data, error } = await supabase
      .from("product_likes")
      .select("product_id")
      .eq("user_id", userId)
      .in("product_id", ids);
    if (error) console.error("SUPABASE ERROR (likes, mes likes):", error);
    for (const row of (data ?? []) as { product_id: string }[]) liked.add(row.product_id);
  } else {
    // Visiteur : une seule requête renvoie tous ses likes (pas besoin de filtrer par produit).
    const visitorId = getVisitorId(false);
    if (visitorId) {
      const { data, error } = await supabase.rpc("get_visitor_likes", { p_visitor_id: visitorId });
      if (error) console.error("SUPABASE ERROR (likes visiteur, lecture):", error);
      for (const productId of (data ?? []) as unknown as string[]) liked.add(productId);
    }
  }

  for (const id of ids) {
    cache.set(id, { count: counts.get(id) ?? 0, liked: liked.has(id) });
  }
}

async function flush() {
  // Boucle : les identifiants ajoutés pendant une requête sont traités juste après.
  while (queue.size > 0) {
    const ids = [...queue];
    queue = new Set();
    try {
      await fetchInfo(ids);
    } catch (err) {
      console.error("SUPABASE ERROR (likes):", err);
    }
  }
  pending = null;
}

/** Nombre de likes d'un produit et indication "je l'ai aimé", regroupés par lots. */
export function loadLikeInfo(productId: string): Promise<LikeInfo> {
  const fallback: LikeInfo = { count: 0, liked: false };
  if (!isSupabaseConfigured()) return Promise.resolve(fallback);

  ensureAuthListener();

  const cached = cache.get(productId);
  if (cached) return Promise.resolve(cached);

  queue.add(productId);
  if (!pending) pending = Promise.resolve().then(flush);
  return pending.then(() => cache.get(productId) ?? fallback);
}

/** Mémorise localement le nouvel état après un clic. */
export function rememberLikeInfo(productId: string, info: LikeInfo) {
  cache.set(productId, info);
}

/**
 * Like d'un visiteur sans compte.
 * La base décide : si le visiteur avait déjà aimé ce produit, le like est retiré, sinon il est ajouté.
 * Elle renvoie l'état final et le compteur à jour.
 */
async function toggleVisitorLike(supabase: SupabaseBrowserClient, productId: string): Promise<ToggleResult> {
  const visitorId = getVisitorId(true);
  if (!visitorId) return { ok: false, reason: "error" };

  const { data, error } = await supabase.rpc("toggle_visitor_like", {
    p_product_id: productId,
    p_visitor_id: visitorId,
  });

  if (error) {
    // La base refuse au-delà de 60 likes par heure et par visiteur (300 par adresse IP).
    if (error.message?.includes("Trop de likes")) return { ok: false, reason: "limit" };
    console.error("SUPABASE ERROR (like visiteur):", error);
    return { ok: false, reason: "error" };
  }

  const row = ((data ?? []) as unknown as { liked: boolean; like_count: number }[])[0];
  if (!row) return { ok: false, reason: "error" };
  return { ok: true, liked: row.liked, count: row.like_count };
}

/** Aime (liked = false -> true) ou retire son like (liked = true -> false). */
export async function toggleLike(productId: string, currentlyLiked: boolean): Promise<ToggleResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "error" };
  const supabase = createClient();
  if (!supabase) return { ok: false, reason: "error" };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Pas de compte : on passe par l'identifiant anonyme du visiteur.
  if (!session) return toggleVisitorLike(supabase, productId);

  const userId = session.user.id;

  if (currentlyLiked) {
    const { error } = await supabase
      .from("product_likes")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) {
      console.error("SUPABASE ERROR (unlike):", error);
      return { ok: false, reason: "error" };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("product_likes").insert({ user_id: userId, product_id: productId });
  if (error) {
    // 23505 : déjà aimé (double clic) -> le résultat voulu est atteint.
    if (error.code === "23505") return { ok: true };
    // 42501 : refusé par la base (produit à soi, ou produit non visible).
    if (error.code === "42501") return { ok: false, reason: "own" };
    console.error("SUPABASE ERROR (like):", error);
    return { ok: false, reason: "error" };
  }
  return { ok: true };
}
