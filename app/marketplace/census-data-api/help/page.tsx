import Link from "next/link";
import { CensusApiTester } from "@/components/census/CensusApiTester";
import { MarketplaceListingLogo } from "@/components/marketplace/MarketplaceListingLogo";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Census Bureau API help — Source Signal",
  description: "Try the U.S. Census Bureau ACS API: poverty and homeownership by city and year.",
};

export default function CensusApiHelpPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-primary">Marketplace</Link>
        <span className="mx-2">›</span>
        <Link href="/marketplace/census-data-api" className="hover:text-primary">
          Census Data API
        </Link>
        <span className="mx-2">›</span>
        <span className="text-primary">API help &amp; tester</span>
      </nav>

      <div className="max-w-3xl">
        <div className="flex items-start gap-4">
          <MarketplaceListingLogo
            listingSlug="census-data-api"
            companyName="U.S. Census Bureau"
            size="lg"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              U.S. Census Bureau
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold text-primary">
              Census Bureau API help page
            </h1>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">
          Explore American Community Survey (ACS 5-year) data live. Choose poverty and/or
          homeownership metrics, a year range, and a U.S. city — then run the same kind of
          requests you would make against{" "}
          <code className="text-xs font-mono bg-primary/[0.06] px-1 rounded">api.census.gov</code>.
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-primary/[0.03] px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-primary">How it works:</strong> Cities are loaded from the Census
          places endpoint on page load. Queries run server-side using our Census API key so your
          key stays private. Data is returned in the browser as a table you can export to CSV.
        </p>
        <p className="mt-2">
          Need your own key for production?{" "}
          <a
            href="https://api.census.gov/data/key_signup.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            Sign up at Census.gov
          </a>
          .
        </p>
      </div>

      <div className="mt-10">
        <CensusApiTester />
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/marketplace/census-data-api">
          <Button variant="outline" size="sm">Back to marketplace listing</Button>
        </Link>
        <a
          href="https://www.census.gov/data/developers.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm">Official Census developer docs</Button>
        </a>
      </div>
    </div>
  );
}
