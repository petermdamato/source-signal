const CENSUS_BASE = "https://api.census.gov/data";

export function getCensusApiKey(): string {
  const key = process.env.CENSUS_API_KEY?.trim();
  if (!key) {
    throw new Error("CENSUS_API_KEY is not configured");
  }
  return key;
}

export type CensusPlace = {
  name: string;
  state: string;
  place: string;
  label: string;
};

/** ACS tables use _001E = denominator, _002E = numerator for rate calculations. */
export const DEMOGRAPHIC_LABELS = [
  "Total",
  "Non-Hispanic White",
  "Black alone",
  "Asian alone",
  "Hispanic",
] as const;

const RACE_ETHNICITY_SUFFIXES: Record<string, string> = {
  "Non-Hispanic White": "H",
  "Black alone": "B",
  "Asian alone": "D",
  Hispanic: "I",
};

const POVERTY_BASE = "B17001";
const HOMEOWNERSHIP_BASE = "B25003";

export const YEAR_MIN = 1979;
export const YEAR_MAX = 2024;
/** ACS 5-year estimates only exist from 2009 onward; earlier years return nulls. */
export const ACS5_FIRST_YEAR = 2009;
export const AVAILABLE_YEARS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => YEAR_MIN + i
);

export type CensusMetric = "poverty" | "homeownership";

export async function fetchCensusJson(url: string): Promise<string[][]> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Census API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as string[][];
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error("Unexpected Census API response");
  }
  return data;
}

export function buildPlacesUrl(year = 2024): string {
  const key = getCensusApiKey();
  return (
    `${CENSUS_BASE}/${year}/acs/acs5` +
    `?get=NAME&for=place:*&in=state:*&key=${encodeURIComponent(key)}`
  );
}

export function parsePlaces(rows: string[][]): CensusPlace[] {
  const [header, ...body] = rows;
  const nameIdx = header.indexOf("NAME");
  const stateIdx = header.indexOf("state");
  const placeIdx = header.indexOf("place");
  if (nameIdx === -1 || stateIdx === -1 || placeIdx === -1) {
    throw new Error("Invalid places response headers");
  }

  return body
    .map((row) => ({
      name: row[nameIdx] ?? "",
      state: row[stateIdx] ?? "",
      place: row[placeIdx] ?? "",
      label: row[nameIdx] ?? "",
    }))
    .filter((p) => p.name && p.state && p.place)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function rateFromCounts(denominator: number, numerator: number): number | null {
  // Census annotation fill values (e.g. -666666666) are negative; treat as no data.
  if (!Number.isFinite(denominator) || !Number.isFinite(numerator)) return null;
  if (denominator <= 0 || numerator < 0) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}

async function fetchAcsRateForTable(
  year: number,
  state: string,
  place: string,
  table: string
): Promise<number | null> {
  const key = getCensusApiKey();
  const url =
    `${CENSUS_BASE}/${year}/acs/acs5` +
    `?get=NAME,${table}_001E,${table}_002E` +
    `&for=place:${place}&in=state:${state}` +
    `&key=${encodeURIComponent(key)}`;

  const data = await fetchCensusJson(url);
  const denominator = Number.parseInt(data[1][1], 10);
  const numerator = Number.parseInt(data[1][2], 10);
  return rateFromCounts(denominator, numerator);
}

export type DemographicRatesResult = {
  rates: Record<string, number | null>;
  /** Demographic labels whose Census fetch failed (network/API error). */
  failedLabels: string[];
};

async function fetchDemographicRatesForYear(
  year: number,
  state: string,
  place: string,
  baseTable: string
): Promise<DemographicRatesResult> {
  const tables: [label: string, table: string][] = [
    ["Total", baseTable],
    ...Object.entries(RACE_ETHNICITY_SUFFIXES).map(
      ([label, suffix]): [string, string] => [label, `${baseTable}${suffix}`]
    ),
  ];

  const settled = await Promise.all(
    tables.map(async ([label, table]) => {
      try {
        const rate = await fetchAcsRateForTable(year, state, place, table);
        return { label, rate, failed: false };
      } catch {
        return { label, rate: null, failed: true };
      }
    })
  );

  const rates: Record<string, number | null> = {};
  const failedLabels: string[] = [];
  for (const { label, rate, failed } of settled) {
    rates[label] = rate;
    if (failed) failedLabels.push(label);
  }
  return { rates, failedLabels };
}

export async function fetchPovertyRatesForYear(
  year: number,
  state: string,
  place: string
): Promise<DemographicRatesResult> {
  return fetchDemographicRatesForYear(year, state, place, POVERTY_BASE);
}

export async function fetchHomeownershipRatesForYear(
  year: number,
  state: string,
  place: string
): Promise<DemographicRatesResult> {
  return fetchDemographicRatesForYear(year, state, place, HOMEOWNERSHIP_BASE);
}
