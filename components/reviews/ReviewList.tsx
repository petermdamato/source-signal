import { ReviewCard } from "./ReviewCard";
import type { ReviewWithProfile } from "@/types/database";

type ReviewListProps = {
  reviews: ReviewWithProfile[];
};

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
        <p className="font-medium">No reviews yet</p>
        <p className="mt-1 text-sm">Be the first to share your experience with a data vendor.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <ReviewCard
            review={review}
            companyName={review.companies?.name}
            companySlug={review.companies?.slug}
          />
        </li>
      ))}
    </ul>
  );
}
