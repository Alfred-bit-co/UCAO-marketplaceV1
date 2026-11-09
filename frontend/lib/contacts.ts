import { getOrCreateVisitorId } from "./likes";
import { createClient } from "./supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ContactStat = { total: number; last7Days: number };

/**
 * Compte un clic « Contacter » (fonction SQL record_contact_click).
 * Sans attente ni message : WhatsApp s'ouvre de toute façon, un clic non compté ne gêne personne.
 * La base ne compte qu'un contact par personne, par produit et par 24 h.
 */
export function recordContactClick(productId: string): void {
  if (!UUID_PATTERN.test(productId)) return; // produits de démonstration
  const supabase = createClient();
  if (!supabase) return;

  void supabase
    .rpc("record_contact_click", { p_product_id: productId, p_visitor_id: getOrCreateVisitorId() })
    .then(({ error }) => {
      if (error) console.warn("Compteur de contacts indisponible :", error.message);
    });
}

/** Contacts reçus par les produits du vendeur connecté ; null si le compteur n'est pas disponible. */
export async function getMyContactStats(): Promise<Map<string, ContactStat> | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_my_contact_stats");
  if (error || !data) {
    console.warn("Compteur de contacts indisponible :", error?.message);
    return null;
  }

  return toContactStats(data as { product_id: string; total: number | string; last_7_days: number | string }[]);
}

/** Les nombres arrivent parfois en texte (bigint) : on les convertit. */
export function toContactStats(
  rows: { product_id: string; total: number | string; last_7_days: number | string }[],
): Map<string, ContactStat> {
  return new Map(
    rows.map((row) => [row.product_id, { total: Number(row.total) || 0, last7Days: Number(row.last_7_days) || 0 }]),
  );
}
