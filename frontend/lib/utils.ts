import { CURRENCY } from "./constants";
import type { Profile, UserRole, VerificationStatus } from "./types";

export function formatPrice(value: number | string | null | undefined): string {
  return `${Number(value ?? 0).toLocaleString("fr-FR")} ${CURRENCY}`;
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

/** Échappe les caractères spéciaux des requêtes ilike Supabase/Postgres. */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export function getPostLoginRedirect(profile: Pick<Profile, "role" | "verification_status">): string {
  if (profile.role === "ADMIN") return "/admin";
  if (profile.verification_status !== "approved") return "/verification";
  if (profile.role === "VENDEUR") return "/dashboard";
  return "/products";
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
