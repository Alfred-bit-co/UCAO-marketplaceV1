// Politique de sécurité du contenu (CSP) du site.
// Fichier sans dépendance (pas d'import « @/… ») : il est lu par next.config.ts.

/** Projet Supabase du site (base, authentification, fichiers, temps réel). */
export const SUPABASE_HOST = "kodlozakvjuegwtetewm.supabase.co";
/** Micro-service des paiements d'abonnement (Render). */
export const PAYMENT_API_ORIGIN = "https://ucao-marketplace-api.onrender.com";

const GOOGLE_IDENTITY = "https://accounts.google.com";
const TURNSTILE = "https://challenges.cloudflare.com";
const SUPABASE = `https://${SUPABASE_HOST}`;

/**
 * Appliquée tout de suite (ne peut rien casser) : interdit d'afficher le site dans un cadre
 * (clickjacking), les plugins et la modification de l'adresse de base des liens.
 */
export const ENFORCED_CSP = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

/**
 * CSP complète, en mode Report-Only pour l'instant.
 *
 * script-src garde 'unsafe-inline' : Next.js (App Router, pages statiques) écrit lui-même
 * de petits scripts en ligne pour l'hydratation. Les remplacer par des nonces obligerait à
 * rendre TOUTES les pages dynamiquement (plus de cache). Le script du thème, lui, est un
 * fichier du site (public/theme-init.js), couvert par 'self'.
 */
export function buildContentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", GOOGLE_IDENTITY, TURNSTILE],
    "style-src": ["'self'", "'unsafe-inline'", GOOGLE_IDENTITY],
    "img-src": ["'self'", "data:", "blob:", SUPABASE, "https://*.googleusercontent.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", SUPABASE, `wss://${SUPABASE_HOST}`, PAYMENT_API_ORIGIN, GOOGLE_IDENTITY, TURNSTILE],
    "frame-src": [GOOGLE_IDENTITY, TURNSTILE],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}
