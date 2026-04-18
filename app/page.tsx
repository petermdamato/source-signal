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
      <section className="relative overflow-hidden bg-[#2C4C5C] text-white">
        <div className="absolute inset-0 bg-[#1e3642]/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            The directory for{" "}
            <span style={{ color: '#d4a017' }}>data vendor</span> reviews
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[#B8BFC1] sm:text-lg">
            Discover and compare data providers. Read real reviews from people
            who use them—and add your own.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/reviews" className="sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-[#B8BFC1]/60 text-[#B8BFC1] hover:bg-[#B8BFC1]/15 hover:text-white sm:w-auto"
              >
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
                <SparkleIcon className="h-5 w-5 shrink-0" style={{ fill: '#d4a017' }} />
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
