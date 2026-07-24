"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

export function CreateOrgForm({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create org"); return; }
      setOpen(false);
      setName("");
      router.refresh();
      if (data.organization?.id) {
        router.push(`/dashboard-protected-routes/developers?org=${data.organization.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={compact ? "w-full text-xs" : ""}
      >
        + New organization
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Organization name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="primary" disabled={loading || !name.trim()}>
          {loading ? "Creating…" : "Create"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
