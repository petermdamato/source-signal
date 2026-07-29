import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewWithProfile } from "@/types/database";

/**
 * Fetches reviews and merges in profile display names.
 * profiles.id = reviews.user_id, but there's no direct FK from reviews to profiles.
 */
export async function fetchReviewsWithProfiles(
  supabase: SupabaseClient,
  options?: {
    companyId?: string;
    userId?: string;
    limit?: number;
  }
) {
  let query = supabase
    .from("reviews")
    .select("*, companies!inner(name, slug, is_active)")
    .eq("hidden", false);

  // Public surfaces hide reviews for inactive companies; dashboard keeps the user's own rows.
  if (!options?.userId) {
    query = query.eq("companies.is_active", true);
  }

  query = query.order("created_at", { ascending: false });

  if (options?.companyId) {
    query = query.eq("company_id", options.companyId);
  }
  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("fetchReviewsWithProfiles:", error.message);
    return [] as ReviewWithProfile[];
  }

  if (!reviews || reviews.length === 0) {
    return [] as ReviewWithProfile[];
  }

  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, full_name: p.full_name }])
  );

  return reviews.map((r) => ({
    ...r,
    profiles: profileMap.get(r.user_id) ?? null,
  })) as ReviewWithProfile[];
}

export function getReviewerDisplayName(review: ReviewWithProfile): string {
  const p = review.profiles;
  const name = p?.display_name?.trim() || p?.full_name?.trim();
  return name || "A reviewer";
}
