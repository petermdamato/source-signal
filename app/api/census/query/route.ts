import { NextRequest, NextResponse } from "next/server";
import {
  ACS5_FIRST_YEAR,
  AVAILABLE_YEARS,
  type CensusMetric,
  DEMOGRAPHIC_LABELS,
  fetchHomeownershipRatesForYear,
  fetchPovertyRatesForYear,
} from "@/lib/census-api";

type Body = {
  metrics?: CensusMetric[];
  years?: number[];
  state?: string;
  place?: string;
};

/** Years processed concurrently; each year fans out up to 10 Census requests. */
const YEAR_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { metrics = [], years = [], state, place } = body;

  if (!metrics.length) {
    return NextResponse.json({ error: "Select at least one metric" }, { status: 400 });
  }
  if (!years.length) {
    return NextResponse.json({ error: "Select at least one year" }, { status: 400 });
  }
  if (!state?.trim() || !place?.trim()) {
    return NextResponse.json({ error: "Select a city" }, { status: 400 });
  }

  const allowedYears = new Set<number>(AVAILABLE_YEARS);
  const invalidYears = years.filter((y) => !allowedYears.has(y));
  if (invalidYears.length) {
    return NextResponse.json({ error: `Invalid years: ${invalidYears.join(", ")}` }, { status: 400 });
  }

  const invalidMetrics = metrics.filter((m) => m !== "poverty" && m !== "homeownership");
  if (invalidMetrics.length) {
    return NextResponse.json({ error: "Invalid metrics" }, { status: 400 });
  }

  const sortedYears = [...years].sort((a, b) => a - b);

  const perYear = await mapWithConcurrency(sortedYears, YEAR_CONCURRENCY, async (year) => {
    const [poverty, homeownership] = await Promise.all([
      metrics.includes("poverty") ? fetchPovertyRatesForYear(year, state, place) : null,
      metrics.includes("homeownership") ? fetchHomeownershipRatesForYear(year, state, place) : null,
    ]);
    return { year, poverty, homeownership };
  });

  const rows: Record<string, string | number | null>[] = [];
  const failedYears = new Set<number>();

  for (const { year, poverty, homeownership } of perYear) {
    const row: Record<string, string | number | null> = { Year: year };

    if (poverty) {
      for (const label of DEMOGRAPHIC_LABELS) {
        row[`Poverty: ${label} (%)`] = poverty.rates[label] ?? null;
      }
      if (poverty.failedLabels.length && year >= ACS5_FIRST_YEAR) failedYears.add(year);
    }

    if (homeownership) {
      for (const label of DEMOGRAPHIC_LABELS) {
        row[`Homeownership: ${label} (%)`] = homeownership.rates[label] ?? null;
      }
      if (homeownership.failedLabels.length && year >= ACS5_FIRST_YEAR) failedYears.add(year);
    }

    rows.push(row);
  }

  const columns = rows.length
    ? ["Year", ...Object.keys(rows[0]).filter((k) => k !== "Year")]
    : ["Year"];

  const warnings: string[] = [];
  if (sortedYears.some((y) => y < ACS5_FIRST_YEAR)) {
    warnings.push(
      `ACS 5-year estimates start in ${ACS5_FIRST_YEAR}; earlier years have no data and show as blank.`
    );
  }
  if (failedYears.size) {
    warnings.push(
      `Some Census requests failed for ${[...failedYears].sort((a, b) => a - b).join(", ")}; blank cells for those years may be errors rather than missing data.`
    );
  }

  return NextResponse.json({
    columns,
    rows,
    warnings,
    meta: { state, place, metrics, years: sortedYears },
  });
}
