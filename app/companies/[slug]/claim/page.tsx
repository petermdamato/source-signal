import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { activeCompaniesFilter } from "@/lib/companies-active";
import { ClaimCompanyForm } from "./ClaimCompanyForm";

type Props = { params: Promise<{ slug: string }> };

export default async function ClaimCompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: company, error } = await activeCompaniesFilter(
    supabase
      .from("companies")
      .select("id, name, slug, website_url, claimed")
      .eq("slug", slug)
  ).single();

  if (error || !company) notFound();
  if (company.claimed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-primary">Already claimed</h1>
        <p className="mt-2 text-muted-foreground">
          This company profile has already been claimed. Only the verified contact can edit it.
        </p>
        <Link href={`/companies/${slug}`} className="mt-6 inline-block text-muted-foreground hover:text-primary hover:underline transition-colors">
          ← Back to {company.name}
        </Link>
      </div>
    );
  }

  if (!company.website_url?.trim()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-primary">Cannot claim yet</h1>
        <p className="mt-2 text-muted-foreground">
          This company does not have a website URL. Add one to the listing first, or contact support.
        </p>
        <Link href={`/companies/${slug}`} className="mt-6 inline-block text-muted-foreground hover:text-primary hover:underline transition-colors">
          ← Back to {company.name}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href={`/companies/${slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Back to {company.name}
      </Link>
      <h1 className="font-display mt-6 text-2xl font-bold text-primary">Claim this company</h1>
      <p className="mt-2 text-muted-foreground">
        Enter a work email address that matches your company&apos;s website domain. We&apos;ll send a
        verification link to confirm you can edit this profile.
      </p>
      <div className="mt-8">
        <ClaimCompanyForm
          companyId={company.id}
          companySlug={company.slug}
          companyName={company.name}
          websiteUrl={company.website_url}
        />
      </div>
    </div>
  );
}
