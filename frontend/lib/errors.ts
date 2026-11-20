/**
 * Traduction des erreurs techniques (Supabase, PostgreSQL, réseau) en messages que tout le monde comprend.
 *
 * Règle du site : aucun message brut (« new row violates row-level security policy… », codes, anglais)
 * n'est jamais affiché. Le détail technique reste dans la console (console.error) pour le débogage.
 */

export type ErrorLike =
  | { message?: string | null; code?: string | null; details?: string | null; hint?: string | null; status?: number | null }
  | null
  | undefined;

/** Affiché quand la connexion à la base n'est pas disponible (clés absentes, client non créé). */
export const SERVICE_UNAVAILABLE = "Le service est momentanément indisponible. Réessayez dans quelques minutes.";

export const SESSION_EXPIRED = "Votre session a expiré. Reconnectez-vous, puis réessayez.";

const CONTACT = "ucaomarketplace2026@gmail.com ou +228 92 98 29 26";

/**
 * Messages écrits par nos propres fonctions SQL (raise exception) : souvent sans accents ou trop techniques.
 * On les reconnaît par un extrait et on les réécrit proprement.
 */
const DATABASE_MESSAGES: { match: string; message: string }[] = [
  { match: "compte est suspendu", message: `Votre compte est suspendu : vous ne pouvez plus rien publier. Contactez l'équipe : ${CONTACT}.` },
  { match: "compte suspendu", message: `Votre compte est suspendu : vous ne pouvez plus rien publier. Contactez l'équipe : ${CONTACT}.` },
  { match: "abonnement a expire", message: "Votre abonnement a expiré. Renouvelez-le depuis la page « Devenir vendeur » pour publier à nouveau." },
  { match: "limite de produits atteinte", message: "Vous avez atteint le nombre maximum de produits de votre palier. Supprimez un produit ou changez de palier pour en publier davantage." },
  { match: "limite de stands atteinte", message: "Vous avez atteint le nombre maximum de stands de votre palier. Supprimez un stand ou changez de palier pour en créer davantage." },
  { match: "ce stand ne vous appartient pas", message: "Ce stand ne vous appartient pas : choisissez l'un de vos propres stands." },
  { match: "utilisez le formulaire de verification", message: "Pour changer de type de compte ou de profession, passez par le formulaire de vérification." },
  { match: "ne peut etre modifie que par un administrateur", message: "Seule l'équipe d'administration peut changer ce statut." },
  { match: "ne peut pas etre modifie", message: "Cette information ne peut pas être modifiée." },
  { match: "role du proprietaire", message: "Le rôle du propriétaire du site ne peut pas être modifié depuis le site." },
  { match: "valider votre propre carte", message: "Vous ne pouvez pas valider votre propre carte d'étudiant : un autre administrateur doit le faire." },
  { match: "modification non autorisee", message: "Vous n'avez pas le droit de modifier cette information." },
];

function normalize(text: string): string {
  // Retire les accents pour comparer « expiré » et « expire » de la même façon.
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Transforme n'importe quelle erreur en phrase claire.
 * @param fallback message utilisé quand l'erreur n'est pas reconnue (décrit l'action qui a échoué).
 */
export function friendlyError(error: ErrorLike | unknown, fallback = "Une erreur est survenue. Réessayez dans quelques instants."): string {
  if (!error) return fallback;
  const err = (typeof error === "object" ? error : { message: String(error) }) as NonNullable<ErrorLike>;
  const message = err.message ?? "";
  const code = (err.code ?? "").toUpperCase();
  const status = err.status ?? 0;
  const text = normalize(`${message} ${err.details ?? ""} ${err.hint ?? ""}`);

  // Réseau
  if (text.includes("failed to fetch") || text.includes("networkerror") || text.includes("network request failed") || text.includes("fetch failed") || text.includes("load failed")) {
    return "Connexion internet instable : impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.";
  }

  // Messages écrits par nos fonctions SQL
  for (const entry of DATABASE_MESSAGES) {
    if (text.includes(entry.match)) return entry.message;
  }

  // Session expirée ou absente
  if (code === "PGRST301" || code === "PGRST302" || text.includes("jwt expired") || text.includes("invalid jwt") || text.includes("auth session missing") || status === 401) {
    return SESSION_EXPIRED;
  }

  // Refus des règles de sécurité (RLS) : le plus souvent, session expirée ou compte changé dans un autre onglet.
  if (code === "42501" || text.includes("row-level security") || text.includes("permission denied") || status === 403) {
    return "Action refusée. Votre session a peut-être expiré ou vous avez changé de compte : rechargez la page, reconnectez-vous si besoin, puis réessayez.";
  }

  // Trop de demandes
  if (status === 429 || text.includes("rate limit") || text.includes("too many")) {
    return "Trop de tentatives en peu de temps. Patientez quelques minutes avant de réessayer.";
  }

  // Contraintes de la base
  if (code === "23505") {
    if (text.includes("phone")) return "Ce numéro est déjà utilisé par un autre compte.";
    return "Cette information existe déjà. Vérifiez que vous ne l'avez pas déjà enregistrée.";
  }
  if (code === "23502") return "Un champ obligatoire est vide. Complétez le formulaire, puis réessayez.";
  if (code === "23503") return "L'élément concerné n'existe plus. Rechargez la page, puis réessayez.";
  if (code === "23514") return "Une des valeurs saisies n'est pas acceptée. Vérifiez le formulaire (longueur des textes, format du numéro, prix…).";
  if (code === "22001") return "Un des textes saisis est trop long. Raccourcissez-le, puis réessayez.";
  if (code === "22P02" || code === "22003") return "Une des valeurs saisies n'est pas au bon format. Vérifiez le formulaire.";
  if (code === "PGRST116") return "Élément introuvable : il a peut-être été supprimé. Rechargez la page.";

  // Panne côté serveur
  if (status >= 500 || text.includes("internal server error") || text.includes("service unavailable")) {
    return "Le service est momentanément indisponible. Réessayez dans quelques minutes.";
  }

  return fallback;
}
