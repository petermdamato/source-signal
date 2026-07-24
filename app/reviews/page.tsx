import { createClient } from "@/lib/supabase/server";
import { ReviewList } from "@/components/reviews";
import { fetchReviewsWithProfiles } from "@/lib/fetch-reviews-with-profiles";

export const metadata = {
  title: "Reviews",
  description: "Recent data vendor reviews from the community.",
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const reviews = await fetchReviewsWithProfiles(supabase, { limit: 50 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Reviews</h1>
      <p className="mt-2 text-muted-foreground">
        Latest community reviews of data vendors.
      </p>
      <div className="mt-8">
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
}
