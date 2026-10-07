import { createClient, isSupabaseConfigured } from "./supabase";

export type LikeInfo = { count: number; liked: boolean };

export type ToggleResult =
  | { ok: true }
  | { ok: false; reason: "login" | "own" | "error" };

/**
 * Likes sur les produits.
 *
 * - Le nombre de likes est public (table product_stats, mise à jour par la base).
 * - Les likes individuels sont privés : chacun ne voit que les siens.
 * - Les demandes de plusieurs cartes affichées en même temps sont regroupées
 *   en deux requêtes (compteurs + mes likes) au lieu d'une requête par carte.
 */

const cache = new Map<string, LikeInfo>();
let queue = new Set<string>();
let pending: Promise<void> | null = null;
let listening = false;

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

/** Aime (liked = false -> true) ou retire son like (liked = true -> false). */
export async function toggleLike(productId: string, currentlyLiked: boolean): Promise<ToggleResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "error" };
  const supabase = createClient();
  if (!supabase) return { ok: false, reason: "error" };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "login" };
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