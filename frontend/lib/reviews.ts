import { createClient, isSupabaseConfigured } from "./supabase";

export type PlatformReview = {
  id: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  author: { name: string; role: string } | null;
};

export async function getApprovedReviews(limit = 6): Promise<PlatformReview[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("platform_reviews")
    .select("id, rating, comment, status, created_at, profiles(full_name, role)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("SUPABASE ERROR (getApprovedReviews):", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    created_at: row.created_at,
    author: row.profiles ? { name: row.profiles.full_name, role: row.profiles.role } : null,
  }));
}

export async function getMyReview(userId: string): Promise<PlatformReview | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("platform_reviews")
    .select("id, rating, comment, status, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("SUPABASE ERROR (getMyReview):", error);
    return null;
  }
  return data ? { ...(data as any), author: null } : null;
}

export async function submitReview(
  userId: string,
  payload: { rating: number; comment: string },
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase non configuré." };
  const supabase = createClient();
  if (!supabase) return { error: "Supabase non configuré." };

  const { error } = await supabase
    .from("platform_reviews")
    .upsert({ user_id: userId, rating: payload.rating, comment: payload.comment }, { onConflict: "user_id" });

  if (error) {
    console.error("SUPABASE ERROR (submitReview):", error);
    return { error: error.message };
  }
  return { error: null };
}

export async function getPendingReviewsForAdmin(): Promise<PlatformReview[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("platform_reviews")
    .select("id, rating, comment, status, created_at, profiles(full_name, role)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("SUPABASE ERROR (getPendingReviewsForAdmin):", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    created_at: row.created_at,
    author: row.profiles ? { name: row.profiles.full_name, role: row.profiles.role } : null,
  }));
}

export async function updateReviewStatus(
  reviewId: string,
  status: "approved" | "rejected",
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.from("platform_reviews").update({ status }).eq("id", reviewId);
  if (error) console.error("SUPABASE ERROR (updateReviewStatus):", error);
  return !error;
}

export async function getPlatformStats(): Promise<{ products: number; vendors: number }> {
  if (!isSupabaseConfigured()) return { products: 0, vendors: 0 };
  const supabase = createClient();
  if (!supabase) return { products: 0, vendors: 0 };

  const [{ count: products }, { count: vendors }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "VENDEUR"),
  ]);

  return { products: products ?? 0, vendors: vendors ?? 0 };
}