import { createClient } from "@/lib/supabase";
import type { SubscriptionTier } from "@/lib/types";

/**
 * Essai gratuit des vendeurs + signalement des doublons d'inscription.
 *
 * La source de vérité est TOUJOURS la base de données (fonctions SQL `start_trial`,
 * `trial_status` et `admin_duplicate_flags`). Ce fichier ne fait que les appeler
 * et traduire leurs réponses en messages lisibles.
 */

// Durées d'essai AFFICHÉES. Les durées réelles sont fixées dans la fonction SQL start_trial :
// si vous les changez là-bas, changez-les ici aussi.
export const TRIAL_DURATIONS: Record<SubscriptionTier, { days: number; label: string }> = {
  STANDARD: { days: 60, label: "2 mois" },
  PREMIUM: { days: 30, label: "1 mois" },
  VIP: { days: 14, label: "14 jours" },
};

export type TrialReason =
  | "ok"
  | "not_authenticated"
  | "no_profile"
  | "admin"
  | "suspended"
  | "missing_phone"
  | "already_active"
  | "already_used"
  | "unavailable";

export type TrialStatus = { eligible: boolean; reason: TrialReason };

const KNOWN_REASONS: TrialReason[] = [
  "ok",
  "not_authenticated",
  "no_profile",
  "admin",
  "suspended",
  "missing_phone",
  "already_active",
  "already_used",
];

/** L'essai est-il disponible pour l'utilisateur connecté ? */
export async function getTrialStatus(): Promise<TrialStatus> {
  const supabase = createClient();
  if (!supabase) return { eligible: false, reason: "unavailable" };

  const { data, error } = await supabase.rpc("trial_status");
  if (error) {
    console.error("TRIAL STATUS ERROR:", error.message);
    return { eligible: false, reason: "unavailable" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const reason = KNOWN_REASONS.includes(row?.reason) ? (row.reason as TrialReason) : "unavailable";
  return { eligible: Boolean(row?.eligible), reason };
}

export type StartTrialResult = { ok: true; endsAt: string } | { ok: false; message: string; reason?: TrialReason };

/** Démarre l'essai gratuit du palier choisi (une seule fois par personne). */
export async function startTrial(tier: SubscriptionTier): Promise<StartTrialResult> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Service indisponible. Réessayez dans un instant." };

  const { data, error } = await supabase.rpc("start_trial", { p_tier: tier });
  if (error) {
    const text = (error.message || "").toLowerCase();
    if (text.includes("essai gratuit deja utilise")) {
      return {
        ok: false,
        reason: "already_used",
        message: "Votre essai gratuit a déjà été utilisé. Vous pouvez choisir un abonnement pour continuer.",
      };
    }
    if (text.includes("abonnement ou essai deja actif")) {
      return { ok: false, reason: "already_active", message: "Vous avez déjà un abonnement ou un essai en cours." };
    }
    if (text.includes("telephone requis")) {
      return { ok: false, reason: "missing_phone", message: "Ajoutez votre numéro de téléphone avant de démarrer l'essai." };
    }
    if (text.includes("compte suspendu")) {
      return { ok: false, reason: "suspended", message: "Votre compte est suspendu. Contactez un administrateur." };
    }
    console.error("START TRIAL ERROR:", error.message);
    return { ok: false, message: "Impossible de démarrer l'essai pour le moment. Réessayez dans un instant." };
  }

  return { ok: true, endsAt: String(data) };
}

/**
 * Vrai si l'abonnement actuel du profil est encore (ou était) un essai gratuit.
 * Un paiement prolonge `subscription_expires_at` au-delà de `trial_ends_at` :
 * dans ce cas le profil n'est plus considéré comme en essai.
 */
export function isTrialSubscription(profile: {
  trial_ends_at?: string | null;
  subscription_expires_at?: string | null;
}): boolean {
  if (!profile.trial_ends_at || !profile.subscription_expires_at) return false;
  const trialEnd = new Date(profile.trial_ends_at).getTime();
  const expires = new Date(profile.subscription_expires_at).getTime();
  if (Number.isNaN(trialEnd) || Number.isNaN(expires)) return false;
  return expires <= trialEnd;
}

// ---------------------------------------------------------------------
// Admin : doublons d'inscription
// ---------------------------------------------------------------------

export type DuplicateKind = "phone" | "email" | "card" | "identity";

export type DuplicateFlag = {
  userId: string;
  /** true = téléphone, e-mail normalisé ou carte identiques (rouge) ; false = nom + filière + niveau seulement (orange) */
  strong: boolean;
  kinds: DuplicateKind[];
  previousAccounts: number;
  earliestSeenAt: string | null;
  anyPreviousDeleted: boolean;
  trialAlreadyUsed: boolean;
};

/** Doublons détectés, indexés par identifiant d'utilisateur. Réservé aux administrateurs. */
export async function getDuplicateFlags(): Promise<Record<string, DuplicateFlag>> {
  const supabase = createClient();
  if (!supabase) return {};

  const { data, error } = await supabase.rpc("admin_duplicate_flags");
  if (error) {
    console.error("ADMIN DUPLICATES ERROR:", error.message);
    return {};
  }

  const flags: Record<string, DuplicateFlag> = {};
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const userId = String(row.user_id);
    flags[userId] = {
      userId,
      strong: Boolean(row.strong),
      kinds: Array.isArray(row.kinds) ? (row.kinds as DuplicateKind[]) : [],
      previousAccounts: Number(row.previous_accounts ?? 1),
      earliestSeenAt: row.earliest_seen_at ? String(row.earliest_seen_at) : null,
      anyPreviousDeleted: Boolean(row.any_previous_deleted),
      trialAlreadyUsed: Boolean(row.trial_already_used),
    };
  }
  return flags;
}
