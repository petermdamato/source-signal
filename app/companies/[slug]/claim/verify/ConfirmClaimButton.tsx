"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { completeCompanyClaim } from "@/app/actions/claim-company";

type Props = { token: string };

export function ConfirmClaimButton({ token }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setError(null);
    setIsPending(true);
    const result = await completeCompanyClaim(token);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }
    router.push(`/companies/${result.companySlug}/edit`);
    router.refresh();
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Claiming…" : "Confirm claim"}
      </Button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
