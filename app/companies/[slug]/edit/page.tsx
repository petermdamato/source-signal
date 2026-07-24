import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CompanyProfileForm } from "./CompanyProfileForm";

type Props = { params: Promise<{ slug: string }> };

export default async function CompanyEditPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=" + encodeURIComponent(`/companies/${slug}/edit`));

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, slug, delivery_method_ids, data_attribute_ids, claimed, claimed_by_user_id")
    .eq("slug", slug)
    .single();

  if (error || !company) notFound();

  const canEdit =
    !company.claimed || (company.claimed_by_user_id != null && company.claimed_by_user_id === user.id);
  if (!canEdit) notFound();

  const deliveryMethodIds: string[] = company.delivery_method_ids ?? [];
  const dataAttributeIds: string[] = company.data_attribute_ids ?? [];

  const [deliveryMethodsRes, allAttributesRes] = await Promise.all([
    supabase.from("data_delivery_methods").select("id, name").order("name"),
    dataAttributeIds.length > 0
      ? supabase.from("data_attributes").select("id, name").in("id", dataAttributeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  type AttrRow = { id: string; name: string };
  const allDeliveryMethods = deliveryMethodsRes.data ?? [];
  const initialAttributeRows: AttrRow[] = (allAttributesRes.data as AttrRow[] | null) ?? [];
  const attrById = new Map(initialAttributeRows.map((r) => [r.id, r]));
  const initialAttributes: AttrRow[] = dataAttributeIds
    .map((id: string) => attrById.get(id))
    .filter((r): r is AttrRow => r != null);

  const { data: publicAttributes } = await supabase
    .from("data_attributes")
    .select("id, name")
    .eq("public", true)
    .order("name");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <Link
          href={`/companies/${slug}`}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to {company.name}
        </Link>
      </div>
      <h1 className="font-display text-2xl font-bold text-primary">Edit company profile</h1>
      <p className="mt-1 text-muted-foreground">{company.name}</p>
      <div className="mt-8">
        <CompanyProfileForm
          companyId={company.id}
          companySlug={company.slug}
          companyName={company.name}
          initialDeliveryIds={deliveryMethodIds}
          initialAttributes={initialAttributes}
          allDeliveryMethods={allDeliveryMethods}
          publicAttributes={publicAttributes ?? []}
        />
      </div>
    </div>
  );
}
