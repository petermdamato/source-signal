"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { RatingLabelWithTooltip } from "@/components/reviews/RatingTooltip";
import { StarRatingInput } from "@/components/reviews/StarRatingInput";
import { FOUND_WHEN_OPTIONS, RESULT_OPTIONS } from "@/lib/review-options";

type ReviewFormProps = {
  companyId: string;
  companySlug: string;
  companyName: string;
};

const RATING_LABELS = [
  { key: "rating", label: "Overall", tooltipKey: "rating" as const },
  { key: "ease_of_access_rating", label: "Accessibility", tooltipKey: "ease_of_access_rating" as const },
  { key: "sales_team_rating", label: "Sales Team", tooltipKey: "sales_team_rating" as const },
  { key: "data_coverage_rating", label: "Data Coverage", tooltipKey: "data_coverage_rating" as const },
  { key: "value_rating", label: "Value", tooltipKey: "value_rating" as const },
] as const;

export function ReviewForm({ companyId, companySlug, companyName }: ReviewFormProps) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number | null>>({
    rating: 5,
    ease_of_access_rating: 5,
    sales_team_rating: 5,
    data_coverage_rating: 5,
    value_rating: 5,
  });
  const [foundWhen, setFoundWhen] = useState("");
  const [result, setResult] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  function setRating(key: string, value: number | null) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in to submit a review.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      company_id: companyId,
      user_id: user.id,
      rating: ratings.rating,
      ease_of_access_rating: ratings.ease_of_access_rating,
      sales_team_rating: ratings.sales_team_rating,
      data_coverage_rating: ratings.data_coverage_rating,
      value_rating: ratings.value_rating,
      found_when: foundWhen || null,
      result: result || null,
      title: title.trim(),
      body: body.trim() || null,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/companies/${companySlug}`);
    router.refresh();
  }

  const selectClass =
    "mt-1 w-full rounded-lg border border-primary/25 bg-card px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          {RATING_LABELS.map(({ key, label, tooltipKey }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-primary">
                <RatingLabelWithTooltip label={label} tooltipKey={tooltipKey} />
              </label>
              <div className="mt-2 text-2xl">
                <StarRatingInput
                  value={ratings[key] ?? 5}
                  onChange={(v) => setRating(key, v)}
                  ariaLabel={`${label} rating`}
                />
              </div>
            </div>
          ))}

          <div>
            <label htmlFor="found-when" className="block text-sm font-medium text-primary">
              I found this {companyName} when I was…
            </label>
            <select
              id="found-when"
              value={foundWhen}
              onChange={(e) => setFoundWhen(e.target.value)}
              className={selectClass}
            >
              <option value="">Select…</option>
              {FOUND_WHEN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="result" className="block text-sm font-medium text-primary">
              Result
            </label>
            <select
              id="result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={selectClass}
            >
              <option value="">Select…</option>
              {RESULT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-primary">
              Review title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-primary">
              Your review (optional)
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share details that would help others..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-primary/25 bg-card px-3 py-2 text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit review"}
            </Button>
            <Link href={`/companies/${companySlug}`}>
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Not signed in?{" "}
          <Link href="/login" className="text-muted-foreground font-medium hover:text-primary hover:underline transition-colors">
            Sign in to submit
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
