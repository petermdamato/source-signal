"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";

type Place = { name: string; state: string; place: string; label: string };

type QueryResult = {
  columns: string[];
  rows: Record<string, string | number | null>[];
  warnings?: string[];
};

const YEAR_MIN = 1979;
const YEAR_MAX = 2024;
const AVAILABLE_YEARS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => YEAR_MIN + i
);
const DEFAULT_STATE = "13";
const DEFAULT_PLACE = "04000"; // Atlanta

export function CensusApiTester() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(`${DEFAULT_STATE}|${DEFAULT_PLACE}`);

  const [metrics, setMetrics] = useState({ poverty: true, homeownership: true });
  const [yearStart, setYearStart] = useState(YEAR_MIN);
  const [yearEnd, setYearEnd] = useState(YEAR_MAX);

  const [running, setRunning] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  useEffect(() => {
    fetch("/api/census/places")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load cities");
        setPlaces(data.places ?? []);
      })
      .catch((e: Error) => setPlacesError(e.message))
      .finally(() => setPlacesLoading(false));
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    let list = q
      ? places.filter((p) => p.label.toLowerCase().includes(q))
      : places.slice(0, 200);
    const selected = places.find((p) => `${p.state}|${p.place}` === selectedKey);
    if (selected && !list.some((p) => p.state === selected.state && p.place === selected.place)) {
      list = [selected, ...list];
    }
    return list.slice(0, 200);
  }, [places, citySearch, selectedKey]);

  const selectedPlace = useMemo(() => {
    const [state, place] = selectedKey.split("|");
    return places.find((p) => p.state === state && p.place === place) ?? null;
  }, [places, selectedKey]);

  const toggleMetric = (key: "poverty" | "homeownership") => {
    setMetrics((m) => ({ ...m, [key]: !m[key] }));
  };

  const runQuery = useCallback(async () => {
    const selectedMetrics = (["poverty", "homeownership"] as const).filter((k) => metrics[k]);
    if (!selectedMetrics.length) {
      setQueryError("Select at least one metric.");
      return;
    }

    const start = Math.min(yearStart, yearEnd);
    const end = Math.max(yearStart, yearEnd);
    const years = AVAILABLE_YEARS.filter((y) => y >= start && y <= end);

    const [state, place] = selectedKey.split("|");
    if (!state || !place) {
      setQueryError("Select a city.");
      return;
    }

    setRunning(true);
    setQueryError(null);
    setResult(null);

    try {
      const res = await fetch("/api/census/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: selectedMetrics, years, state, place }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      setResult(data);
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setRunning(false);
    }
  }, [metrics, yearStart, yearEnd, selectedKey]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Metrics */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-primary mb-3">Metrics</h2>
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={metrics.poverty}
                onChange={() => toggleMetric("poverty")}
                className="mt-0.5 accent-primary"
              />
              <span>
                <span className="font-medium text-primary">Poverty rate</span>
                <span className="block text-xs text-muted-foreground">
                  Total + race/ethnicity (ACS B17001), % below poverty level
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={metrics.homeownership}
                onChange={() => toggleMetric("homeownership")}
                className="mt-0.5 accent-primary"
              />
              <span>
                <span className="font-medium text-primary">Homeownership rate</span>
                <span className="block text-xs text-muted-foreground">
                  Total + race/ethnicity (ACS B25003), owner-occupied ÷ occupied housing, %
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Years */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-primary mb-3">Years (ACS 5-year)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="year-start">From</label>
              <select
                id="year-start"
                value={yearStart}
                onChange={(e) => setYearStart(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="year-end">To</label>
              <select
                id="year-end"
                value={yearEnd}
                onChange={(e) => setYearEnd(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ACS 5-year data starts in 2009 — earlier years return blank cells.
          </p>
        </div>
      </div>

      {/* City */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-primary mb-3">City (Census place)</h2>
        {placesLoading && (
          <p className="text-sm text-muted-foreground">Loading U.S. places from Census API…</p>
        )}
        {placesError && (
          <p className="text-sm text-error">{placesError}</p>
        )}
        {!placesLoading && !placesError && (
          <div className="space-y-3">
            <Input
              placeholder="Search cities (e.g. Atlanta, Boston)…"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {filteredPlaces.map((p) => (
                <option key={`${p.state}|${p.place}`} value={`${p.state}|${p.place}`}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {places.length.toLocaleString()} places loaded.
              {citySearch ? ` Showing ${filteredPlaces.length} matches.` : " Showing first 200 — search to narrow."}
              {selectedPlace && (
                <> Selected: <span className="font-mono">{selectedPlace.label}</span> (state {selectedPlace.state}, place {selectedPlace.place})</>
              )}
            </p>
          </div>
        )}
      </div>

      <div>
        <Button
          variant="accent"
          size="lg"
          onClick={runQuery}
          disabled={running || placesLoading || !!placesError}
        >
          {running ? "Running query…" : "Run Census API query"}
        </Button>
        {queryError && <p className="mt-2 text-sm text-error">{queryError}</p>}
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {result.warnings && result.warnings.length > 0 && (
            <div className="border-b border-border bg-accent/[0.08] px-5 py-3 space-y-1">
              {result.warnings.map((w) => (
                <p key={w} className="text-xs text-primary/80">
                  {w}
                </p>
              ))}
            </div>
          )}
          <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-primary">Results</h2>
            <button
              type="button"
              className="text-xs text-accent underline"
              onClick={() => {
                const header = result.columns.join(",");
                const lines = result.rows.map((row) =>
                  result.columns.map((col) => {
                    const v = row[col];
                    return v == null ? "" : String(v);
                  }).join(",")
                );
                const csv = [header, ...lines].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "census_query_results.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary/[0.04] text-left">
                  {result.columns.map((col) => (
                    <th key={col} className="px-4 py-2 font-semibold text-primary whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {result.columns.map((col) => (
                      <td key={col} className="px-4 py-2 font-mono text-primary/90 whitespace-nowrap">
                        {row[col] == null ? "—" : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
