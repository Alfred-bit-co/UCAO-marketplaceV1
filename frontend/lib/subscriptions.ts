import { createClient, isSupabaseConfigured } from "./supabase";
import { PAYMENT_API_URL } from "./constants";
import { SUBSCRIPTION_PLANS } from "./types";
import type { SubscriptionTier } from "./types";

export { SUBSCRIPTION_PLANS };

export type SubscriptionStatus = {
  tier: SubscriptionTier | null;
  expiresAt: string | null;
  isBlocked: boolean;
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
    .select("role, subscription_tier, subscription_expires_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  const tier = profile.subscription_tier as SubscriptionTier | null;
  const expiresAt = profile.subscription_expires_at as string | null;
  const isBlocked =
    profile.role === "VENDEUR" && (!expiresAt || new Date(expiresAt).getTime() < Date.now());

  const plan = planFor(tier);

  const [{ count: productCount }, { count: standCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("stands").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    tier,
    expiresAt,
    isBlocked,
    productCount: productCount ?? 0,
    productLimit: plan?.productLimit ?? 0,
    standCount: standCount ?? 0,
    standLimit: plan?.standLimit ?? 0,
  };
}

export async function initiateSubscriptionPayment(
  tier: SubscriptionTier,
): Promise<{ paymentUrl: string } | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const response = await fetch(`${PAYMENT_API_URL}/subscriptions/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tier }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { paymentUrl: data.payment_url };
  } catch {
    return null;
  }
}

export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}