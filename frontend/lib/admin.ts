import { createClient, isSupabaseConfigured } from "./supabase";
import { PAYMENT_API_URL } from "./constants";
import { escapeIlike } from "./utils";
import type { Profile, SubscriptionTier, UserRole } from "./types";

export type MonthlySignup = { month: string; count: number };
export type RoleCount = { role: UserRole; count: number };
export type TierCount = { tier: SubscriptionTier; count: number };
export type AdminStats = {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  pendingStands: number;
  pendingVerifications: number;
  totalReviews: number;
  approvedReviews: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const empty: AdminStats = {
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    pendingStands: 0,
    pendingVerifications: 0,
    totalReviews: 0,
    approvedReviews: 0,
  };
  if (!isSupabaseConfigured()) return empty;
  const supabase = createClient();
  if (!supabase) return empty;

  const [users, vendors, products, stands, verifications, reviews, approvedReviews] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "VENDEUR"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("stands").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending")
      .not("student_id_url", "is", null),
    supabase.from("platform_reviews").select("*", { count: "exact", head: true }),
    supabase.from("platform_reviews").select("*", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  return {
    totalUsers: users.count ?? 0,
    totalVendors: vendors.count ?? 0,
    totalProducts: products.count ?? 0,
    pendingStands: stands.count ?? 0,
    pendingVerifications: verifications.count ?? 0,
    totalReviews: reviews.count ?? 0,
    approvedReviews: approvedReviews.count ?? 0,
  };
}

export async function getUsersByRole(): Promise<RoleCount[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("profiles").select("role");
  if (error || !data) return [];

  const counts = data.reduce<Record<UserRole, number>>(
    (acc, row) => {
      const role = row.role as UserRole;
      acc[role] = (acc[role] ?? 0) + 1;
      return acc;
    },
    { ACHETEUR: 0, VENDEUR: 0, ADMIN: 0 },
  );

  return (Object.entries(counts) as [UserRole, number][]).map(([role, count]) => ({ role, count }));
}

export async function getSubscriptionTierDistribution(): Promise<TierCount[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("role", "VENDEUR")
    .not("subscription_tier", "is", null);

  if (error || !data) return [];

  const counts = data.reduce<Record<SubscriptionTier, number>>(
    (acc, row) => {
      const tier = row.subscription_tier as SubscriptionTier;
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    { STANDARD: 0, PREMIUM: 0, VIP: 0 },
  );

  return (Object.entries(counts) as [SubscriptionTier, number][]).map(([tier, count]) => ({ tier, count }));
}

export async function getMonthlyUserSignups(): Promise<MonthlySignup[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const buckets = data.reduce<Record<string, number>>((acc, row) => {
    if (!row.created_at) return acc;
    const month = row.created_at.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(buckets).map(([month, count]) => ({ month, count }));
}

export async function getVendorSignupsByMonth(): Promise<MonthlySignup[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("vendor_signups_monthly").select("*");
  if (error || !data) {
    console.error("SUPABASE ERROR (getVendorSignupsByMonth):", error);
    return [];
  }
  return data
    .map((row: { month: string; new_vendors: number }) => ({ month: row.month, count: Number(row.new_vendors) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function getProductPublishByMonth(): Promise<MonthlySignup[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select("created_at").order("created_at", { ascending: true });
  if (error || !data) return [];
  const buckets = data.reduce<Record<string, number>>((acc, row) => { if (row.created_at) { const month = row.created_at.slice(0, 7); acc[month] = (acc[month] ?? 0) + 1; } return acc; }, {});
  return Object.entries(buckets).map(([month, count]) => ({ month, count }));
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  let request = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
  if (query.trim()) {
    const term = escapeIlike(query.trim());
    request = request.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await request;
  if (error || !data) {
    console.error("SUPABASE ERROR (searchProfiles):", error);
    return [];
  }
  return data as Profile[];
}

export async function deleteUserAccount(userId: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configuré." };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: "Vous devez être connecté." };

  try {
    const response = await fetch(`${PAYMENT_API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, message: data?.error || `Erreur (code ${response.status}).` };
    }
    return { ok: true };
  } catch (err) {
    console.error("ADMIN ERROR (deleteUserAccount):", err);
    return { ok: false, message: "Impossible de contacter le serveur." };
  }
}
