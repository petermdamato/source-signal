"use client";

import { useState } from "react";

export function FilterSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="shrink-0 lg:w-56">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
          aria-expanded={open}
        >
          <span className="text-sm font-medium text-primary">Filter by category</span>
          <span
            className="text-muted-foreground transition-transform duration-200"
            style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            ▾
          </span>
        </button>
        {open && (
          <div className="mt-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            {children}
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-4 shadow-sm">
          {children}
        </div>
      </div>
    </aside>
  );
}
