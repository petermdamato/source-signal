"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

type UserMetadata = {
  full_name?: string;
  industry?: string;
  display_name?: string;
};

export function ProfileEditForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Load from profiles table (source of truth for display)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, display_name, industry")
        .eq("id", user.id)
        .single();
      if (profile) {
        setFullName(profile.full_name ?? "");
        setIndustry(profile.industry ?? "");
        setDisplayName(profile.display_name ?? "");
      } else {
        const m = (user.user_metadata ?? {}) as UserMetadata;
        setFullName(m.full_name ?? "");
        setIndustry(m.industry ?? "");
        setDisplayName(m.display_name ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: "error", text: "Not signed in." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName.trim() || null,
        industry: industry.trim() || null,
        display_name: displayName.trim() || null,
      },
      { onConflict: "id" }
    );

    if (error) {
      setSaving(false);
      setMessage({ type: "error", text: error.message });
      return;
    }

    await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim() || undefined,
        industry: industry.trim() || undefined,
        display_name: displayName.trim() || undefined,
      },
    });

    setSaving(false);
    setMessage({ type: "success", text: "Profile updated." });
    router.refresh();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-primary-mid/15" />
            <div className="h-10 w-full rounded bg-primary-mid/12" />
            <div className="h-10 w-full rounded bg-primary-mid/12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <p className="text-sm font-normal text-muted-foreground mt-1">
          Update your account details. Display name is used when you leave reviews.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <p
              className={
                message.type === "error"
                  ? "text-sm text-error"
                  : "text-sm text-primary"
              }
            >
              {message.text}
            </p>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-primary">
              Name
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">Your full name will not be displayed publicly.</p>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-primary">
              Industry
            </label>
            <Input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Finance, Healthcare"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-primary">
              Display name
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shown on your reviews. Leave blank to appear as &quot;A reviewer&quot;.
            </p>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jane from Acme"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Link href="/dashboard-protected-routes">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
