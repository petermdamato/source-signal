"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

function getRedirectPath(redirectTo: string | null): string {
  if (!redirectTo || typeof redirectTo !== "string") return "/dashboard-protected-routes";
  const path = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;
  if (!path.startsWith("/")) return "/dashboard-protected-routes";
  return path;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => getRedirectPath(searchParams.get("redirectTo")), [searchParams]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createClient();

  function flipToSignUp() { setMessage(null); setIsSignUp(true); }
  function flipToSignIn() { setMessage(null); setIsSignUp(false); }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: "Signed in. Redirecting…" });
    window.location.href = redirectTo;
  }

  async function handleOAuthSignIn() {
    setLoading(true);
    setMessage(null);
    const callbackUrl =
      redirectTo !== "/dashboard-protected-routes"
        ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/api/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    setLoading(false);
    if (error) { setMessage({ type: "error", text: error.message }); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || undefined,
          industry: industry.trim() || undefined,
        },
      },
    });
    setLoading(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: "Check your email for the confirmation link." });
  }

  const dividerClass = "w-full border-t border-border";
  const dividerTextClass = "bg-card px-2 text-xs uppercase tracking-wider text-muted-foreground";
  const mutedTextClass = "text-sm text-muted-foreground";
  const linkClass = "font-medium text-primary hover:underline";
  const labelClass = "block text-sm font-medium text-primary";

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="flip-card-container relative h-[640px] sm:h-[580px]">
        <div className={`flip-card-inner h-full w-full ${isSignUp ? "flipped" : ""}`}>

          {/* Sign in — front */}
          <div className="flip-card-face">
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-bold">Sign in</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {message && !isSignUp && (
                  <p className={message.type === "error" ? "text-sm text-error" : "text-sm font-medium text-primary"}>
                    {message.text}
                  </p>
                )}
                <form onSubmit={handleSignIn} className="flex-1 space-y-4">
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                  </div>
                  <div>
                    <label htmlFor="password" className={labelClass}>Password</label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? "…" : "Sign in"}</Button>
                </form>
                <div className="relative my-4">
                  <span className="absolute inset-0 flex items-center"><span className={dividerClass} /></span>
                  <span className="relative flex justify-center"><span className={dividerTextClass}>Or continue with</span></span>
                </div>
                <Button type="button" variant="outline" onClick={handleOAuthSignIn} disabled={loading} className="w-full justify-center">
                  Sign in with Google
                </Button>
                <p className={`mt-4 ${mutedTextClass}`}>
                  Not registered?{" "}
                  <button type="button" onClick={flipToSignUp} className={linkClass}>Sign up</button>
                </p>
                <p className={`mt-2 ${mutedTextClass}`}>
                  <Link href="/" className={linkClass}>← Back to home</Link>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sign up — back (flipped) */}
          <div className="flip-card-face flip-card-face-back">
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-bold">Sign up</CardTitle>
                <p className={`mt-1 text-sm font-normal ${mutedTextClass}`}>
                  Submit reviews or save vendors for contact.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {message && isSignUp && (
                  <p className={message.type === "error" ? "text-sm text-error" : "text-sm font-medium text-primary"}>
                    {message.text}
                  </p>
                )}
                <form onSubmit={handleSignUp} className="flex-1 space-y-4">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>Name</label>
                    <p className="mt-0.5 text-xs text-muted-foreground">Your full name will not be displayed.</p>
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1" />
                  </div>
                  <div>
                    <label htmlFor="industry" className={labelClass}>Industry</label>
                    <Input id="industry" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Finance, Healthcare" className="mt-1" />
                  </div>
                  <div>
                    <label htmlFor="signup-email" className={labelClass}>Email</label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                  </div>
                  <div>
                    <label htmlFor="signup-password" className={labelClass}>Password</label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? "…" : "Sign up"}</Button>
                </form>
                <div className="relative my-4">
                  <span className="absolute inset-0 flex items-center"><span className={dividerClass} /></span>
                  <span className="relative flex justify-center"><span className={dividerTextClass}>Or continue with</span></span>
                </div>
                <Button type="button" variant="outline" onClick={handleOAuthSignIn} disabled={loading} className="w-full justify-center">
                  Sign up with Google
                </Button>
                <p className={`mt-4 ${mutedTextClass}`}>
                  Already have an account?{" "}
                  <button type="button" onClick={flipToSignIn} className={linkClass}>Sign in</button>
                </p>
                <p className={`mt-2 ${mutedTextClass}`}>
                  <Link href="/" className={linkClass}>← Back to home</Link>
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
