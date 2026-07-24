"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

const SCOPE_OPTIONS = [
  { value: "catalog:read", label: "catalog:read — Browse listings and vendors" },
  { value: "data:read", label: "data:read — Call gateway endpoints" },
  { value: "subscribe", label: "subscribe — Create subscriptions" },
];

export function ApiKeysPanel({
  organizationId,
  apiKeys,
  userRole,
}: {
  organizationId: string;
  apiKeys: ApiKey[];
  userRole: string;
}) {
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["catalog:read"]);
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>(apiKeys);
  const router = useRouter();

  const canCreate = userRole === "owner" || userRole === "developer";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: organizationId,
          name: newKeyName,
          scopes: selectedScopes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create key"); return; }
      setCreatedKey(data.api_key.key);
      setKeys([{ ...data.api_key, revoked_at: null, last_used_at: null }, ...keys]);
      setCreating(false);
      setNewKeyName("");
      setSelectedScopes(["catalog:read"]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/api-keys/${keyId}`, { method: "DELETE" });
    if (res.ok) {
      setKeys(keys.map((k) => k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k));
      router.refresh();
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  return (
    <div className="space-y-4">
      {createdKey && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-900 mb-1">API key created — copy it now</p>
          <p className="text-xs text-green-700 mb-2">This key will not be shown again.</p>
          <code className="block rounded bg-white border border-green-200 px-3 py-2 text-xs font-mono break-all text-green-900">
            {createdKey}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => { navigator.clipboard.writeText(createdKey); }}
          >
            Copy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 ml-2"
            onClick={() => setCreatedKey(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {creating ? (
        <form onSubmit={handleCreate} className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-semibold text-primary">New API key</p>
          <Input
            placeholder="Key name (e.g. Production agent)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            autoFocus
          />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Scopes</p>
            <div className="space-y-1">
              {SCOPE_OPTIONS.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(s.value)}
                    onChange={() => toggleScope(s.value)}
                    className="accent-primary"
                  />
                  <span className="font-mono text-xs">{s.value}</span>
                  <span className="text-muted-foreground text-xs">— {s.label.split("—")[1]}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="primary" disabled={loading || !newKeyName.trim() || selectedScopes.length === 0}>
              {loading ? "Creating…" : "Create key"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : canCreate ? (
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          + Create API key
        </Button>
      ) : null}

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No API keys yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {keys.map((key) => (
            <li key={key.id} className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary truncate">{key.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{key.key_prefix}…</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scopes: {key.scopes.join(", ")} ·{" "}
                  {key.last_used_at
                    ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}`
                    : "Never used"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {key.revoked_at ? (
                  <span className="text-xs text-error font-medium">Revoked</span>
                ) : (
                  <>
                    <span className="text-xs text-green-700 font-medium">Active</span>
                    {canCreate && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(key.id)}
                        className="text-error border-error/30 hover:bg-error/5"
                      >
                        Revoke
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
