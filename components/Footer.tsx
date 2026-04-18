import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--footer-bg)] text-[var(--footer-foreground)]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-lg font-semibold text-primary transition-colors hover:text-accent"
          >
            Source Signal
          </Link>
          <nav className="flex flex-wrap gap-6 text-sm">
            <Link href="/companies" className="text-muted-foreground transition-colors hover:text-primary">
              Browse vendors
            </Link>
            <Link href="/reviews" className="text-muted-foreground transition-colors hover:text-primary">
              Reviews
            </Link>
            <Link href="/dashboard-protected-routes" className="text-muted-foreground transition-colors hover:text-primary">
              Dashboard
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-sm text-muted-foreground/80">
          The directory for data vendor reviews. Share your experience and help others choose.
        </p>
      </div>
    </footer>
  );
}
