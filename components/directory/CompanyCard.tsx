import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { VendorLogo } from "@/components/vendor/VendorLogo";
import type { Company } from "@/types/database";

type CompanyCardProps = {
  company: Company;
};

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.slug}`}>
      <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
          <VendorLogo src={company.logo_url} name={company.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-primary">{company.name}</h3>
              {(company.category || company.subcategory) && (
                <span className="text-xs text-muted-foreground">
                  {[company.category, company.subcategory].filter(Boolean).join(" › ")}
                </span>
              )}
            </div>
            {company.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {company.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
