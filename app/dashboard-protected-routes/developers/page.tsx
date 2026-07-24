import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ApiKeysPanel } from "./ApiKeysPanel";
import { CreateOrgForm } from "./CreateOrgForm";

export const metadata = {
  title: "Developer Hub — Source Signal",
  description: "Manage your organization, API keys, and marketplace subscriptions.",
};

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; success?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard-protected-routes/developers");

  const admin = createAdminClient();

  // Load orgs the user belongs to
  const { data: memberships } = await admin
    .from("org_members")
    .select("role, organizations(id, name, slug, billing_email, created_at)")
    .eq("user_id", user.id);

  type OrgWithRole = {
    id: string; name: string; slug: string; billing_email: string | null; created_at: string; role: string;
  };

  const orgs: OrgWithRole[] = (memberships ?? []).map((m) => ({
    ...(m.organizations as { id: string; name: string; slug: string; billing_email: string | null; created_at: string }),
    role: m.role,
  }));

  const selectedOrgId = sp.org ?? orgs[0]?.id ?? null;
  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? orgs[0] ?? null;

  // Load API keys for selected org
  let apiKeys: {
    id: string; name: string; key_prefix: string; scopes: string[];
    revoked_at: string | null; last_used_at: string | null; created_at: string;
  }[] = [];
  if (selectedOrg) {
    const { data: keys } = await admin
      .from("org_api_keys")
      .select("id, name, key_prefix, scopes, revoked_at, last_used_at, created_at")
      .eq("organization_id", selectedOrg.id)
      .order("created_at", { ascending: false });
    apiKeys = keys ?? [];
  }

  // Load entitlements for selected org
  let entitlements: {
    id: string; status: string; license_accepted_at: string | null; expires_at: string | null; created_at: string;
    marketplace_listings: { id: string; slug: string; title: string; fulfillment_mode: string } | null;
  }[] = [];
  if (selectedOrg) {
    const { data: ents } = await admin
      .from("entitlements")
      .select("id, status, license_accepted_at, expires_at, created_at, marketplace_listings(id, slug, title, fulfillment_mode)")
      .eq("organization_id", selectedOrg.id)
      .order("created_at", { ascending: false });
    entitlements = (ents ?? []) as typeof entitlements;
  }

  const showSuccess = sp.success === "1";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Developer Hub</h1>
          <p className="mt-1 text-muted-foreground">
            Manage API keys, subscriptions, and organization settings.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          Browse marketplace
        </Link>
      </div>

      {showSuccess && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Subscription activated successfully. You can now create API keys below.
        </div>
      )}

      {orgs.length === 0 ? (
        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Create your first organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Organizations hold your API keys, subscriptions, and team members.
              </p>
              <CreateOrgForm />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Org sidebar */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Organizations
            </p>
            {orgs.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard-protected-routes/developers?org=${o.id}`}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedOrg?.id === o.id
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-primary/[0.06]"
                }`}
              >
                {o.name}
                <span className="ml-1 text-[10px] opacity-60 uppercase">{o.role}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-border">
              <CreateOrgForm compact />
            </div>
          </div>

          {/* Main content */}
          {selectedOrg && (
            <div className="space-y-8">
              {/* API Keys */}
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    API keys let you authenticate with the Source Signal API and MCP server.
                    Keys are scoped — create separate keys for different agents.
                  </p>
                  <ApiKeysPanel
                    organizationId={selectedOrg.id}
                    apiKeys={apiKeys}
                    userRole={selectedOrg.role}
                  />
                </CardContent>
              </Card>

              {/* Entitlements */}
              <Card>
                <CardHeader>
                  <CardTitle>Active subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  {entitlements.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No subscriptions yet.{" "}
                      <Link href="/marketplace" className="text-accent underline">
                        Browse the marketplace
                      </Link>{" "}
                      to subscribe to a data API.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {entitlements.map((e) => {
                        const listing = e.marketplace_listings;
                        return (
                          <li key={e.id} className="flex items-center justify-between py-3 text-sm">
                            <div>
                              <span className="font-medium text-primary">
                                {listing?.title ?? "Unknown listing"}
                              </span>
                              <span className="ml-2 text-muted-foreground text-xs">
                                {listing?.fulfillment_mode === "platform" ? "Platform" : "Vendor direct"}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                e.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : e.status === "pending_provisioning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {e.status.replace(/_/g, " ")}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* MCP Config */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect with MCP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Use this config with Claude, OpenClaw, or any MCP-compatible agent. Create an API key above, then paste it in.
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-primary/[0.04] p-4 text-xs font-mono text-primary">
{`{
  "mcpServers": {
    "source-signal": {
      "command": "npx",
      "args": ["source-signal-mcp"],
      "env": {
        "SOURCE_SIGNAL_API_BASE": "${process.env.NEXT_PUBLIC_APP_URL ?? "https://your-domain.com"}",
        "MARKETPLACE_API_KEY": "<your-ss_live_... key here>"
      }
    }
  }
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
