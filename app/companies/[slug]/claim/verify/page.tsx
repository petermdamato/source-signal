import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClaimTokenInfo } from "@/app/actions/claim-company";
import { ConfirmClaimButton } from "./ConfirmClaimButton";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ClaimVerifyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolved = await searchParams;
  const token = typeof resolved.token === "string" ? resolved.token : Array.isArray(resolved.token) ? resolved.token[0] : undefined;
  if (!token?.trim()) notFound();

  const tokenInfo = await getClaimTokenInfo(token);
  if (!tokenInfo.valid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-primary">Invalid or expired link</h1>
        <p className="mt-2 text-muted-foreground">{tokenInfo.error}</p>
        <Link
          href={`/companies/${slug}/claim`}
          className="mt-6 inline-block text-primary hover:underline"
        >
          Request a new verification email
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email?.toLowerCase() ?? "";
  const tokenEmail = tokenInfo.email.toLowerCase();
  const emailMatches = userEmail === tokenEmail;

  if (!user) {
    const verifyUrl = `/companies/${tokenInfo.companySlug}/claim/verify?token=${encodeURIComponent(token)}`;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-primary">Sign in to complete your claim</h1>
        <p className="mt-2 text-muted-foreground">
          You must sign in with <strong>{tokenInfo.email}</strong> to claim {tokenInfo.companyName}.
        </p>
        <Link
          href={`/login?redirectTo=${encodeURIComponent(verifyUrl)}`}
          className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-dark"
        >
          Sign in
        </Link>
        <p className="mt-4">
          <Link href={`/companies/${tokenInfo.companySlug}`} className="text-sm text-muted-foreground hover:text-primary">
            ← Back to {tokenInfo.companyName}
          </Link>
        </p>
      </div>
    );
  }

  if (!emailMatches) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-primary">Wrong account</h1>
        <p className="mt-2 text-muted-foreground">
          You’re signed in as <strong>{user.email}</strong>. To claim {tokenInfo.companyName}, sign
          in with <strong>{tokenInfo.email}</strong>.
        </p>
        <Link
          href={`/login?redirectTo=${encodeURIComponent(`/companies/${tokenInfo.companySlug}/claim/verify?token=${encodeURIComponent(token)}`)}`}
          className="mt-6 inline-block text-primary hover:underline"
        >
          Sign in with {tokenInfo.email}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-xl font-semibold text-primary">Confirm your claim</h1>
      <p className="mt-2 text-muted-foreground">
        You’re signed in as {tokenInfo.email}. Click below to claim {tokenInfo.companyName} and become
        the only editor of this profile.
      </p>
      <div className="mt-8">
        <ConfirmClaimButton token={token} />
      </div>
      <p className="mt-4">
        <Link href={`/companies/${tokenInfo.companySlug}`} className="text-sm text-muted-foreground hover:text-primary">
          ← Cancel and go back
        </Link>
      </p>
    </div>
  );
}
