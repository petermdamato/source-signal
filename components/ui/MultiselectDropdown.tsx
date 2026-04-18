"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type MultiselectOption = { id: string; label: string };

type MultiselectDropdownProps = {
  options: MultiselectOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

export function MultiselectDropdown({
  options,
  selectedIds,
  onToggle,
  placeholder = "Select…",
  className,
  triggerClassName,
}: MultiselectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCount = selectedIds.size;
  const label =
    selectedCount === 0
      ? placeholder
      : selectedCount === 1
        ? options.find((o) => selectedIds.has(o.id))?.label ?? `${selectedCount} selected`
        : `${selectedCount} selected`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-primary/30 bg-card px-3 py-2.5 text-left text-sm text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          triggerClassName
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
      >
        <span className={selectedCount === 0 ? "text-muted-foreground" : ""}>{label}</span>
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-primary/30 bg-card py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={selectedIds.has(opt.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-primary/5",
                selectedIds.has(opt.id) && "bg-primary/10 text-primary"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onToggle(opt.id);
              }}
            >
              <span
                className={cn(
                  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  selectedIds.has(opt.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/30 bg-card"
                )}
              >
                {selectedIds.has(opt.id) ? "✓" : null}
              </span>
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
