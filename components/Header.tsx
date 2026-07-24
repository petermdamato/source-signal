import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { MobileMenu } from "@/components/MobileMenu";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-[var(--header-bg)] shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--header-bg)_92%,transparent)]">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        <div className="flex items-center gap-2">
          <MobileMenu isLoggedIn={!!user} />
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-primary transition-colors hover:text-accent"
          >
            Source Signal
          </Link>
        </div>

        <nav className="hidden min-[551px]:flex items-center gap-6">
          <Link
            href="/companies"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Vendors
          </Link>
          <Link
            href="/reviews"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Reviews
          </Link>
          <Link
            href="/marketplace"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Marketplace
          </Link>
          <Link href="/dashboard-protected-routes">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href={user ? "/dashboard-protected-routes/profile" : "/login"}>
            <Button variant="primary" size="sm">
              {user ? "Account" : "Sign in"}
            </Button>
          </Link>
        </nav>

        <Link
          href={user ? "/dashboard-protected-routes/profile" : "/login"}
          className="min-[551px]:hidden"
        >
          <Button variant="primary" size="sm">
            {user ? "Account" : "Sign in"}
          </Button>
        </Link>

      </div>
    </header>
  );
}
