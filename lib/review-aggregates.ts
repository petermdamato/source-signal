import type { Review } from "@/types/database";

export type ReviewAggregates = {
  count: number;
  avgRating: number | null;
  avgEaseOfAccess: number | null;
  avgSalesTeam: number | null;
  avgDataCoverage: number | null;
  avgValue: number | null;
};

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

/** Non-hidden reviews only. */
export function computeReviewAggregates(reviews: Pick<Review, "hidden" | "rating" | "ease_of_access_rating" | "sales_team_rating" | "data_coverage_rating" | "value_rating">[]): ReviewAggregates {
  const visible = reviews.filter((r) => !r.hidden);
  const ratings = visible.map((r) => r.rating).filter((n): n is number => n != null && n >= 1 && n <= 5);
  const ease = visible.map((r) => r.ease_of_access_rating).filter((n): n is number => n != null && n >= 1 && n <= 5);
  const sales = visible.map((r) => r.sales_team_rating).filter((n): n is number => n != null && n >= 1 && n <= 5);
  const coverage = visible.map((r) => r.data_coverage_rating).filter((n): n is number => n != null && n >= 1 && n <= 5);
  const value = visible.map((r) => r.value_rating).filter((n): n is number => n != null && n >= 1 && n <= 5);
  return {
    count: visible.length,
    avgRating: avg(ratings),
    avgEaseOfAccess: avg(ease),
    avgSalesTeam: avg(sales),
    avgDataCoverage: avg(coverage),
    avgValue: avg(value),
  };
}
