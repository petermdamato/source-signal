import Link from "next/link";

type Props = {
  companySlug: string;
  listingSlug: string;
  active: "reviews" | "marketplace";
};

const tabClass = (isActive: boolean) =>
  [
    "rounded-md px-4 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:text-primary hover:bg-primary/[0.04]",
  ].join(" ");

export function VendorViewSwitch({ companySlug, listingSlug, active }: Props) {
  return (
    <nav
      className="inline-flex gap-1 rounded-lg border border-border bg-card p-1"
      aria-label="Switch between reviews and marketplace"
    >
      <Link
        href={`/companies/${companySlug}`}
        className={tabClass(active === "reviews")}
        aria-current={active === "reviews" ? "page" : undefined}
      >
        Reviews
      </Link>
      <Link
        href={`/marketplace/${listingSlug}`}
        className={tabClass(active === "marketplace")}
        aria-current={active === "marketplace" ? "page" : undefined}
      >
        Marketplace
      </Link>
    </nav>
  );
}
