"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUnclaimedCompanyForCurrentUser } from "@/app/actions/claim-company";

const DISMISS_KEY = "source-signal-claim-notification-dismissed";

function isClaimPath(pathname: string): boolean {
  return /^\/companies\/[^/]+\/claim(\/|$)/.test(pathname);
}

export function ClaimNotification() {
  const pathname = usePathname();
  const [company, setCompany] = useState<{ slug: string; name: string } | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY);
    if (wasDismissed) {
      setLoaded(true);
      return;
    }
    getUnclaimedCompanyForCurrentUser().then((match) => {
      setCompany(match ?? null);
      setDismissed(match === null);
      setLoaded(true);
    });
  }, []);

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1");
  }

  if (isClaimPath(pathname) || !loaded || dismissed || !company) return null;

  return (
    <div
      className="fixed left-4 right-4 top-20 z-[100] max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg sm:right-auto sm:top-20"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">
            We have a profile for your company. Do you want to claim it?
          </p>
          <Link
            href={`/companies/${company.slug}/claim`}
            className="mt-2 inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
            onClick={handleDismiss}
          >
            Claim {company.name} →
          </Link>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
