import { SESSION_EXPIRED } from "./errors";
import { createClient, isSupabaseConfigured } from "./supabase";
import { PAYMENT_API_URL } from "./constants";
import { SUBSCRIPTION_PLANS } from "./types";
import type { SubscriptionTier } from "./types";

export { SUBSCRIPTION_PLANS };

export type SubscriptionStatus = {
  tier: SubscriptionTier | null;
  activatedAt: string | null;
  expiresAt: string | null;
  isBlocked: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  productCount: number;
  productLimit: number;
  standCount: number;
  standLimit: number;
};

function planFor(tier: SubscriptionTier | null) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.tier === tier) ?? null;
}

export async function getMySubscriptionStatus(): Promise<SubscriptionStatus | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_tier, subscription_activated_at, subscription_expires_at, trial_ends_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  const tier = profile.subscription_tier as SubscriptionTier | null;
  const activatedAt = profile.subscription_activated_at as string | null;
  const expiresAt = profile.subscription_expires_at as string | null;
  const trialEndsAt = (profile.trial_ends_at as string | null) ?? null;
  const isBlocked =
    profile.role === "VENDEUR" && (!expiresAt || new Date(expiresAt).getTime() <= Date.now());

  const plan = planFor(tier);

  const [{ count: productCount }, { count: standCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("stands").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    tier,
    activatedAt,
    expiresAt,
    isBlocked,
    isTrial: Boolean(trialEndsAt && expiresAt && new Date(expiresAt).getTime() <= new Date(trialEndsAt).getTime()),
    trialEndsAt,
    productCount: productCount ?? 0,
    productLimit: plan?.productLimit ?? 0,
    standCount: standCount ?? 0,
    standLimit: plan?.standLimit ?? 0,
  };
}

export type InitiatePaymentResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; reason: "not_authenticated" | "network_error" | "server_error"; message: string };

export async function initiateSubscriptionPayment(tier: SubscriptionTier): Promise<InitiatePaymentResult> {
  const supabase = createClient();
  if (!supabase) {
    return { ok: false, reason: "server_error", message: "Le service est momentanément indisponible. Réessayez dans quelques minutes." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("SUBSCRIPTION ERROR: aucune session Supabase active.");
    return { ok: false, reason: "not_authenticated", message: "Vous devez être connecté pour payer. Reconnectez-vous, puis réessayez." };
  }

  try {
    const response = await fetch(`${PAYMENT_API_URL}/subscriptions/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tier }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("SUBSCRIPTION ERROR: réponse serveur non OK", response.status, data);
      return { ok: false, reason: response.status === 401 ? "not_authenticated" : "server_error", message: paymentErrorMessage(response.status, data?.error) };
    }

    if (!isFedaPayCheckoutUrl(data?.payment_url)) {
      console.error("SUBSCRIPTION ERROR: URL de paiement absente ou hors FedaPay", data);
      return { ok: false, reason: "server_error", message: "Le lien de paiement n'a pas pu être créé. Réessayez dans quelques minutes : vous n'avez pas été débité." };
    }

    return { ok: true, paymentUrl: data.payment_url };
  } catch (err) {
    console.error("SUBSCRIPTION ERROR: échec réseau lors de l'appel au backend", err);
    return {
      ok: false,
      reason: "network_error",
      message: "Impossible de joindre le service de paiement. Vérifiez votre connexion internet, puis réessayez.",
    };
  }
}

/**
 * Vrai seulement pour une page de paiement FedaPay en https (process.fedapay.com, sandbox-process.fedapay.com…).
 * Même si le serveur de paiement était compromis, le navigateur ne serait jamais envoyé vers un faux site de paiement.
 */
export function isFedaPayCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "fedapay.com" || url.hostname.endsWith(".fedapay.com")) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Message clair pour un refus du serveur de paiement (le texte du serveur n'est gardé que s'il est destiné au public). */
function paymentErrorMessage(status: number, serverMessage: unknown): string {
  if (status === 401) return SESSION_EXPIRED;
  if (status === 429) return "Trop de tentatives de paiement en peu de temps. Patientez quelques minutes avant de réessayer.";
  if (status === 400) return "Le palier choisi n'est pas valide. Rechargez la page, puis réessayez.";
  if (status >= 500) {
    // 502/503 : FedaPay ou le service est indisponible. Les messages de configuration ne sont pas pour le public.
    return "Le service de paiement est momentanément indisponible. Réessayez dans quelques minutes : vous n'avez pas été débité.";
  }
  return typeof serverMessage === "string" && serverMessage.trim()
    ? serverMessage
    : "Impossible de lancer le paiement pour le moment. Rechargez la page, puis réessayez.";
}

export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** All subscription dates are persisted as timestamptz and displayed in the marketplace's timezone. */
export function formatSubscriptionDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Lome",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}
