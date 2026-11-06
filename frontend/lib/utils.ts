import { CURRENCY } from "./constants";
import type { Profile, UserRole, VerificationStatus } from "./types";

export function formatPrice(value: number | string | null | undefined): string {
  return `${Number(value ?? 0).toLocaleString("fr-FR")} ${CURRENCY}`;
}

/**
 * Titre d'une page produit : « {nom} – {prix} FCFA ».
 * Le modèle du layout ajoute ensuite « | UCAO Marketplace » (ne pas le répéter ici).
 */
export function productPageTitle(name: string, price: number | string | null | undefined): string {
  return `${name.trim()} – ${formatPrice(price)}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStandLimit(role: string): number {
  if (role === "VIP") return 5;
  if (role === "PREMIUM") return 1;
  return 0;
}

export function getProductLimit(tier: string): number {
  if (tier === "VIP") return 30;
  if (tier === "PREMIUM") return 10;
  if (tier === "STANDARD") return 5;
  return 0;
}

export function isValidPhoneNumber(value: string): boolean {
  return /^\+\d{8,15}$/.test(value);
}

/**
 * Normalise un numéro WhatsApp saisi par un vendeur.
 * - Togo : « 92 98 29 26 », « 92982926 », « 228 92982926 », « 00228… » ou « +228… » → « +22892982926 »
 *   (toujours exactement 8 chiffres après +228).
 * - Autre pays : numéro international complet, « + » ou « 00 » puis 8 à 15 chiffres (ex. +22997000000).
 * Renvoie null si le numéro n'est pas exploitable.
 */
export function normalizeWhatsAppNumber(input: string): string | null {
  let value = input.trim().replace(/[\s.\-()/]/g, "");
  if (value.startsWith("00")) value = "+" + value.slice(2);

  if (/^\d{8}$/.test(value)) return `+228${value}`;
  if (/^228\d{8}$/.test(value)) return `+${value}`;
  if (value.startsWith("+228")) return /^\+228\d{8}$/.test(value) ? value : null;
  return /^\+\d{8,15}$/.test(value) ? value : null;
}

/** Échappe les caractères spéciaux des requêtes ilike Supabase/Postgres. */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

/**
 * Valide le paramètre « next » d'une URL : seules les adresses internes au site
 * sont acceptées (pas de « //site.com » ni de « https://… »), sinon null.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return null;
  // Les navigateurs suppriment tabulations et retours à la ligne et lisent « \ » comme « / » :
  // « /\t/site.com » ou « /\site.com » deviendraient « //site.com ». On refuse ces caractères.
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}

export function getPostLoginRedirect(profile: Pick<Profile, "role" | "verification_status">, next?: string | null): string {
  if (profile.role === "ADMIN") return "/admin";
  const safeNext = safeNextPath(next);
  if (safeNext) return safeNext;
  if (profile.role === "VENDEUR") return "/dashboard";
  return "/products";
}

const GOOGLE_ONBOARDING_PATH = "/verification-carte?oauth=google";

/**
 * Destination après une connexion Google réussie (règles appliquées dans cet ordre) :
 * admin → /admin ; conditions non acceptées ou carte d'étudiant jamais envoyée → onboarding ;
 * vendeur → /dashboard ; sinon ?next= s'il est sûr, ou /products.
 * Profil illisible (null) → onboarding, comme l'ancien flux.
 * « Carte envoyée » = student_id_url renseigné (verification_status vaut « pending » par défaut,
 * même sans carte, et ne prouve donc pas l'envoi).
 */
export function getGoogleLoginRedirect(
  profile: Pick<Profile, "role" | "cgu_accepted_at" | "student_id_url"> | null,
  next?: string | null,
): string {
  if (!profile) return GOOGLE_ONBOARDING_PATH;
  if (profile.role === "ADMIN") return "/admin";
  if (!profile.cgu_accepted_at) return GOOGLE_ONBOARDING_PATH;
  if (!profile.student_id_url) return GOOGLE_ONBOARDING_PATH;
  if (profile.role === "VENDEUR") return "/dashboard";
  return safeNextPath(next) ?? "/products";
}

export function isVerified(profile: Pick<Profile, "role" | "verification_status">): boolean {
  return profile.role === "ADMIN" || profile.verification_status === "approved";
}

export function verificationLabel(status?: VerificationStatus | null): string {
  switch (status) {
    case "approved":
      return "Validé";
    case "rejected":
      return "Refusé";
    default:
      return "En attente";
  }
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "VENDEUR":
      return "Vendeur";
    default:
      return "Acheteur";
  }
}
