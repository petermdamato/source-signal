import Link from "next/link";

export function HowItWorksStrip() {
  return (
    <section
      className="border-y border-border bg-card"
      aria-label="How the platform works"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          How it works
        </p>
        <h2 className="font-display mt-2 text-center text-2xl font-semibold text-primary text-balance md:text-3xl">
          How Source Signal works
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="flex flex-col rounded-2xl border border-border bg-background/80 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
              1
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">
              Browse &amp; search vendors
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Search or filter by category to find data vendors. View vendor profiles and read reviews from the community to compare options before you reach out.
            </p>
            <Link
              href="/companies"
              className="mt-4 text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              Browse vendors →
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-background/80 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
              2
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">
              Leave reviews (sign up to contribute)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Once you&apos;re signed up, you can leave reviews to help others. We focus on what matters:{" "}
              <strong className="text-primary">utility of the data</strong>,{" "}
              <strong className="text-primary">ease of contacting sales and negotiating the sales process</strong>,{" "}
              <strong className="text-primary">type of data transfer</strong>, and{" "}
              <strong className="text-primary">quality of the data product for the price</strong>.
            </p>
            <Link
              href="/login"
              className="mt-4 text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              Sign up to review →
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-background/80 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-xl font-bold text-primary">
              3
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">
              Add vendors to your dashboard
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Keep track of vendors you care about. Add them to your dashboard so you can quickly return to their profiles, compare notes, and see new reviews.
            </p>
            <Link
              href="/dashboard-protected-routes"
              className="mt-4 text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              Go to dashboard →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
