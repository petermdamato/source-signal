"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";

type Plan = {
  id: string;
  name: string;
  priceLabel: string;
  interval: string | null;
  trialDays: number;
  quota: Record<string, unknown>;
};

export function SubscribePanel({
  plans,
  listingSlug,
  fulfillmentMode,
  userOrgs,
  isLoggedIn,
}: {
  plans: Plan[];
  listingSlug: string;
  fulfillmentMode: string;
  userOrgs: { id: string; name: string }[];
  isLoggedIn: boolean;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");
  const [selectedOrgId, setSelectedOrgId] = useState(userOrgs[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push(`/login?next=/marketplace/${listingSlug}`);
      return;
    }
    if (!selectedOrgId) {
      setError("Create an organization in Developer Hub first.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/checkout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          organization_id: selectedOrgId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create session"); return; }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.mode === "free" && data.redirect_url) {
        router.push(data.redirect_url);
      } else if (data.mode === "vendor_direct") {
        setMessage(data.message ?? "Request submitted. The vendor will be in touch.");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Plan selector */}
      {plans.map((plan) => (
        <label
          key={plan.id}
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
            selectedPlanId === plan.id
              ? "border-primary bg-primary/[0.04]"
              : "border-border hover:border-primary/40"
          }`}
        >
          <input
            type="radio"
            name="plan"
            value={plan.id}
            checked={selectedPlanId === plan.id}
            onChange={() => setSelectedPlanId(plan.id)}
            className="mt-0.5 accent-primary"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-primary">{plan.name}</span>
              <span className="text-sm font-semibold text-primary">{plan.priceLabel}</span>
            </div>
            {plan.trialDays > 0 && (
              <p className="text-xs text-muted-foreground">{plan.trialDays}-day free trial</p>
            )}
            {Object.keys(plan.quota).length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {Object.entries(plan.quota)
                  .map(([k, v]) => `${String(v).replace(/_/g, " ")} ${k.replace(/_/g, " ")}`)
                  .join(" · ")}
              </p>
            )}
          </div>
        </label>
      ))}

      {/* Org selector (if logged in and multiple orgs) */}
      {isLoggedIn && userOrgs.length > 1 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Subscribe as</label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary"
          >
            {userOrgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoggedIn && userOrgs.length === 0 && (
        <p className="text-xs text-muted-foreground">
          You need an organization to subscribe.{" "}
          <Link href="/dashboard-protected-routes/developers" className="text-accent underline">
            Create one in Developer Hub
          </Link>.
        </p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {message}
        </div>
      )}

      <Button
        variant={fulfillmentMode === "platform" ? "primary" : "accent"}
        className="w-full"
        onClick={handleSubscribe}
        disabled={loading || !selectedPlanId}
      >
        {loading
          ? "Processing…"
          : !isLoggedIn
          ? "Sign in to subscribe"
          : fulfillmentMode === "vendor_direct"
          ? "Request access"
          : selectedPlan?.priceLabel === "Free"
          ? "Get free access"
          : "Subscribe now"}
      </Button>

      {!isLoggedIn && (
        <p className="text-xs text-center text-muted-foreground">
          <Link href={`/login?next=/marketplace/${listingSlug}`} className="text-accent underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/login" className="text-accent underline">
            create an account
          </Link>{" "}
          to subscribe.
        </p>
      )}
    </div>
  );
}
