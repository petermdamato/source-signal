import Link from "next/link";

export function HowItWorksStrip() {
  return (
    <section
      className="border-y border-[#1e3642] bg-[#2C4C5C] text-white"
      aria-label="How the platform works"
    >
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-12 text-center text-2xl font-semibold text-[#B8BFC1]">
          How Source Signal works
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6C8494] text-xl font-bold text-white">
              1
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Browse &amp; search vendors
            </h3>
            <p className="mt-2 text-sm text-[#B8BFC1] leading-relaxed">
              Search or filter by category to find data vendors. View vendor profiles and read reviews from the community to compare options before you reach out.
            </p>
            <Link
              href="/companies"
              className="mt-4 text-sm font-medium text-[#B8BFC1] hover:text-white transition-colors"
            >
              Browse vendors →
            </Link>
          </div>

          <div className="flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6C8494] text-xl font-bold text-white">
              2
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Leave reviews (sign up to contribute)
            </h3>
            <p className="mt-2 text-sm text-[#B8BFC1] leading-relaxed">
              Once you&apos;re signed up, you can leave reviews to help others. We focus on what matters: <strong className="text-white">utility of the data</strong>, <strong className="text-white">ease of contacting sales and negotiating the sales process</strong>, <strong className="text-white">type of data transfer</strong>, and <strong className="text-white">quality of the data product for the price</strong>.
            </p>
            <Link
              href="/login"
              className="mt-4 text-sm font-medium text-[#B8BFC1] hover:text-white transition-colors"
            >
              Sign up to review →
            </Link>
          </div>

          <div className="flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a017] text-xl font-bold text-[#2C4C5C]">
              3
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Add vendors to your dashboard
            </h3>
            <p className="mt-2 text-sm text-[#B8BFC1] leading-relaxed">
              Keep track of vendors you care about. Add them to your dashboard so you can quickly return to their profiles, compare notes, and see new reviews.
            </p>
            <Link
              href="/dashboard-protected-routes"
              className="mt-4 text-sm font-medium text-[#B8BFC1] hover:text-white transition-colors"
            >
              Go to dashboard →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
