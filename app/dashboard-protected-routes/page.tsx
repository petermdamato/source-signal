import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ReviewList } from "@/components/reviews";
import { SignOutButton } from "./SignOutButton";
import { fetchReviewsWithProfiles } from "@/lib/fetch-reviews-with-profiles";

export const metadata = {
  title: "Dashboard",
  description: "Your account and reviews.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard-protected-routes");
  }

  const [reviews, bookmarksResult] = await Promise.all([
    fetchReviewsWithProfiles(supabase, { userId: user.id }),
    supabase
      .from("user_bookmarks")
      .select("company_id, companies(id, name, slug, logo_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  type BookmarkCompany = { id: string; name: string; slug: string; logo_url: string | null };
  const bookmarkedCompanies: BookmarkCompany[] =
    bookmarksResult.data
      ?.map((b) => (b as unknown as { companies: BookmarkCompany | null }).companies)
      .filter((c): c is BookmarkCompany => c != null) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Dashboard</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">
          Signed in as <strong className="text-primary">{user.email}</strong>
        </span>
        <SignOutButton variant="outline" />
        <Link href="/dashboard-protected-routes/profile">
          <Button variant="outline" size="sm">
            Edit profile
          </Button>
        </Link>
        <Link href="/dashboard-protected-routes/developers">
          <Button variant="outline" size="sm">
            Developer hub
          </Button>
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your reviews</CardTitle>
            <Link href="/reviews">
              <Button variant="ghost" size="sm">
                All reviews →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ReviewList reviews={reviews} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bookmarked companies</CardTitle>
            {bookmarkedCompanies.length > 0 && (
              <Link href="/companies">
                <Button variant="ghost" size="sm">
                  Browse more →
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {bookmarkedCompanies.length === 0 ? (
              <>
                <Link href="/companies" className="block">
                  <Button variant="outline" className="w-full justify-center cursor-pointer">
                    Browse companies
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Bookmarked companies will be visible here.
                </p>
              </>
            ) : (
              <ul className="space-y-2">
                {bookmarkedCompanies.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/companies/${c.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:bg-primary/[0.04]"
                    >
                      {c.logo_url ? (
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white">
                          <img
                            src={c.logo_url}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 font-bold text-sm text-primary">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <span className="truncate font-medium text-primary">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
