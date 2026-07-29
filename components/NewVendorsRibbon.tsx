"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { VendorLogo } from "@/components/vendor/VendorLogo";
import type { Company } from "@/types/database";

type NewVendorsRibbonProps = {
  companies: Company[];
};

export function NewVendorsRibbon({ companies }: NewVendorsRibbonProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(companies.length > 3);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -280 : 280, behavior: "smooth" });
  }

  if (companies.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Directory</p>
        <h2 className="mb-2 mt-1 text-lg font-semibold text-primary">New vendors</h2>
        <p className="text-sm text-muted-foreground">No vendors yet. Check back soon.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="New vendors">
      <div className="flex items-center justify-between gap-4 px-4 pb-2 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Directory</p>
          <h2 className="mt-1 text-lg font-semibold text-primary">New vendors</h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous vendors"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/[0.04] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next vendors"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/[0.04] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="overflow-x-auto scroll-smooth pb-4"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex w-max min-w-full snap-x snap-mandatory gap-3 pl-4 pr-4">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.slug}`} className="w-64 shrink-0 snap-start">
              <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-3">
                  <VendorLogo src={company.logo_url} name={company.name} size="base" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-primary">{company.name}</p>
                    {(company.category || company.subcategory) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {[company.category, company.subcategory].filter(Boolean).join(" › ")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
