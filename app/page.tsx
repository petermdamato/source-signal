import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import { Button } from "@/components/ui";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { NewVendorsRibbon } from "@/components/NewVendorsRibbon";
import { HowItWorksStrip } from "@/components/HowItWorksStrip";
import { fetchReviewsWithProfiles } from "@/lib/fetch-reviews-with-profiles";

export default async function Home() {
  const supabase = await createClient();

  const [reviewsResult, companiesResult] = await Promise.all([
    fetchReviewsWithProfiles(supabase, { limit: 12 }),
    supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const recentReviews = reviewsResult ?? [];
  const newVendors = companiesResult.data ?? [];

  return (
    <div className="min-h-[80vh]">
      <section className="home-hero relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent/[0.08] blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Data vendor directory
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary text-balance sm:text-5xl md:text-6xl">
              The directory for{" "}
              <span className="text-accent">data vendor</span> reviews
            </h1>
            <p className="home-hero-lead mt-5 max-w-2xl text-base sm:text-lg">
              Discover and compare data providers. Read real reviews from people
              who use them—and add your own.
            </p>
          </div>
          <div className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/reviews" className="sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See reviews
              </Button>
            </Link>
            <Link href="/companies" className="sm:w-auto">
              <Button variant="accent" size="lg" className="w-full sm:w-auto">
                Browse vendors
              </Button>
            </Link>
            <Link href="/search/ai" className="sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                Search vendors with AI
                <SparkleIcon className="h-5 w-5 shrink-0 text-accent" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <ReviewsCarousel reviews={recentReviews as never} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <NewVendorsRibbon companies={newVendors} />
      </section>

      <HowItWorksStrip />
    </div>
  );
}
