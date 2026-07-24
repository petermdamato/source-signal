import Link from "next/link";
import { Button } from "@/components/ui";
import { getVendorSelfServeAccess } from "@/lib/marketplace-vendor-access";

export function VendorApiKeyPanel({ listingSlug }: { listingSlug: string }) {
  const access = getVendorSelfServeAccess(listingSlug);
  if (!access) return null;

  const keyIsExternal = access.keyUrl.startsWith("http");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        API keys for this product are issued by the vendor, not Source Signal.
        Create a free account with them to get started.
      </p>

      <div className="space-y-2">
        {keyIsExternal ? (
          <a href={access.keyUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="accent" className="w-full">
              {access.keyLabel}
            </Button>
          </a>
        ) : (
          <Link href={access.keyUrl} className="block">
            <Button variant="accent" className="w-full">
              {access.keyLabel}
            </Button>
          </Link>
        )}

        <a
          href={access.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full">
            {access.docsLabel ?? "View API documentation"}
          </Button>
        </a>

        {access.tryUrl && (
          <Link href={access.tryUrl} className="block">
            <Button variant="outline" className="w-full">
              {access.tryLabel ?? "Try the API"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
