import { CompanyCard } from "./CompanyCard";
import type { Company } from "@/types/database";

type CompanyListProps = {
  companies: Company[];
};

export function CompanyList({ companies }: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-[var(--card)] p-12 text-center text-muted-foreground">
        <p className="font-medium">No vendors yet</p>
        <p className="mt-1 text-sm">Check back soon for data vendor listings.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <li key={company.id}>
          <CompanyCard company={company} />
        </li>
      ))}
    </ul>
  );
}
