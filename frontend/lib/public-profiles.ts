import { createClient, isSupabaseConfigured } from "./supabase";
import type { Seller, SubscriptionTier, UserRole } from "./types";

export type PublicProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  subscription_tier: SubscriptionTier | null;
};

// Existing Supabase projects may not yet have the security migration that
// creates this view. Avoid retrying a known-missing view for every product,
// stand or review rendered during the same page session.
let publicProfilesViewUnavailable = false;

/** Returns only the seller information intentionally exposed in the catalogue. */
export async function getPublicProfiles(userIds: readonly string[]): Promise<Map<string, PublicProfile>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length || !isSupabaseConfigured() || publicProfilesViewUnavailable) return new Map();

  const supabase = createClient();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, full_name, role, phone, subscription_tier")
    .in("id", ids);

  if (error || !data) {
    // The catalogue remains usable without seller metadata. In particular, do
    // not log with console.error here: Next.js displays those expected setup
    // failures as a full-screen development error overlay.
    publicProfilesViewUnavailable = true;
    return new Map();
  }

  return new Map((data as PublicProfile[]).map((profile) => [profile.id, profile]));
}

export function toSeller(profile: PublicProfile | undefined): Seller | null {
  if (!profile) return null;
  return {
    name: profile.full_name,
    role: profile.role,
    phone: profile.phone ?? undefined,
    subscription_tier: profile.subscription_tier,
  };
}
