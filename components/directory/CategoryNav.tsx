"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_LIST, type CategoryName } from "@/lib/categories";
import { cn } from "@/lib/utils";

function buildUrl(
  category: string | null,
  subcategory: string | null,
  searchQuery: string | null,
) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (subcategory) params.set("subcategory", subcategory);
  if (searchQuery && searchQuery.trim()) params.set("q", searchQuery.trim());
  const s = params.toString();
  return s ? `/companies?${s}` : "/companies";
}

type CategoryNavProps = {
  className?: string;
};

export function CategoryNav({ className }: CategoryNavProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const searchQuery = searchParams.get("q");

  const activeCategory = category as CategoryName | null;
  const subcategories =
    activeCategory && activeCategory in CATEGORIES
      ? CATEGORIES[activeCategory as CategoryName]
      : [];

  const linkClass =
    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const activeClass = "text-[#d4a017] font-semibold";
  const inactiveClass =
    "text-[#2C4C5C] hover:bg-[#B8BFC1]/40 hover:text-[#d4a017]";

  return (
    <nav
      className={cn("flex flex-col gap-6", className)}
      aria-label="Browse by category"
    >
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6C8494]">
          Category
        </h2>
        <ul className="space-y-0.5">
          <li>
            <Link
              href={buildUrl(null, null, searchQuery)}
              className={cn(linkClass, !category ? activeClass : inactiveClass)}
            >
              All vendors
            </Link>
          </li>
          {CATEGORY_LIST.map((cat) => (
            <li key={cat}>
              <Link
                href={buildUrl(cat, null, searchQuery)}
                className={cn(
                  linkClass,
                  category === cat ? activeClass : inactiveClass,
                )}
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {subcategories.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6C8494]">
            {activeCategory} – Subcategory
          </h2>
          <ul className="space-y-0.5">
            <li>
              <Link
                href={buildUrl(activeCategory!, null, searchQuery)}
                className={cn(
                  linkClass,
                  !subcategory ? activeClass : inactiveClass,
                )}
              >
                All
              </Link>
            </li>
            {subcategories.map((sub) => (
              <li key={sub}>
                <Link
                  href={buildUrl(activeCategory!, sub, searchQuery)}
                  className={cn(
                    linkClass,
                    subcategory === sub ? activeClass : inactiveClass,
                  )}
                >
                  {sub}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
