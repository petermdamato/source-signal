import Link from "next/link";

const steps = [
  {
    href: "/companies",
    step: "1",
    stepClassName: "bg-primary/10",
    title: "Browse & search vendors",
    body: (
      <>
        Search or filter by category to find data vendors. View vendor profiles and read reviews from
        the community to compare options before you reach out.
      </>
    ),
    cta: "Browse vendors →",
  },
  {
    href: "/login",
    step: "2",
    stepClassName: "bg-primary/10",
    title: "Leave reviews (sign up to contribute)",
    body: (
      <>
        Once you&apos;re signed up, you can leave reviews to help others. We focus on what matters:{" "}
        <strong className="text-primary">utility of the data</strong>,{" "}
        <strong className="text-primary">ease of contacting sales and negotiating the sales process</strong>,{" "}
        <strong className="text-primary">type of data transfer</strong>, and{" "}
        <strong className="text-primary">quality of the data product for the price</strong>.
      </>
    ),
    cta: "Sign up to review →",
  },
  {
    href: "/dashboard-protected-routes",
    step: "3",
    stepClassName: "bg-accent-burg/20",
    title: "Add vendors to your dashboard",
    body: (
      <>
        Keep track of vendors you care about. Add them to your dashboard so you can quickly return to
        their profiles, compare notes, and see new reviews.
      </>
    ),
    cta: "Go to dashboard →",
  },
] as const;

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
          {steps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-background/80 p-6 shadow-sm transition-colors hover:border-primary/30 hover:bg-background"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-primary ${step.stepClassName}`}
              >
                {step.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-primary">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              <span className="mt-auto pt-4 text-sm font-medium text-primary transition-colors group-hover:text-accent-burg">
                {step.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
