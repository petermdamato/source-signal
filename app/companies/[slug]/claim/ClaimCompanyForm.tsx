"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { requestCompanyClaim } from "@/app/actions/claim-company";

type Props = {
  companyId: string;
  companySlug: string;
  companyName: string;
  websiteUrl: string;
};

export function ClaimCompanyForm({ companyId, companySlug, companyName, websiteUrl }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await requestCompanyClaim(
        companySlug,
        companyName,
        websiteUrl,
        companyId,
        email
      );
      if (result.error) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: "Check your email for the verification link." });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="claim-email" className="block text-sm font-medium text-primary">
          Work email
        </label>
        <Input
          id="claim-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="mt-1"
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Must be an address at your company&apos;s domain (from {websiteUrl})
        </p>
      </div>
      {message && (
        <p className={message.type === "error" ? "text-sm text-error" : "text-sm text-primary font-medium"}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Send verification email"}
      </Button>
    </form>
  );
}
