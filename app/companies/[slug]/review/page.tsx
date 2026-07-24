import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./ReviewForm";

type Props = { params: Promise<{ slug: string }> };

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (error || !company) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/companies/${slug}`}
        className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
      >
        ← Back to {company.name}
      </Link>
      <h1 className="font-display mt-4 text-2xl font-bold text-primary">
        Write a review for {company.name}
      </h1>
      <div className="mt-8">
        <ReviewForm companyId={company.id} companySlug={company.slug} companyName={company.name} />
      </div>
    </div>
  );
}
