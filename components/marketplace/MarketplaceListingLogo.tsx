import { marketplaceListingLogoUrl } from "@/lib/marketplace-listing-logos";
import { LogoImage } from "@/components/vendor/LogoImage";

const SIZE_CLASS = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
} as const;

type Props = {
  listingSlug: string;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

export function MarketplaceListingLogo({
  listingSlug,
  companyName,
  companyLogoUrl,
  size = "sm",
  className = "",
}: Props) {
  const logoUrl = marketplaceListingLogoUrl(listingSlug, companyLogoUrl);
  const sizeClass = SIZE_CLASS[size];

  if (logoUrl) {
    return (
      <div className={`${sizeClass} shrink-0 ${className}`}>
        <LogoImage src={logoUrl} alt={companyName ? `${companyName} logo` : ""} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary ${className}`}
    >
      {companyName?.charAt(0) ?? "?"}
    </div>
  );
}
