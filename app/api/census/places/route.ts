import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { buildPlacesUrl, fetchCensusJson, parsePlaces } from "@/lib/census-api";

const getPlaces = unstable_cache(
  async () => {
    const rows = await fetchCensusJson(buildPlacesUrl(2024));
    return parsePlaces(rows);
  },
  ["census-places-2024"],
  { revalidate: 86400 }
);

export async function GET() {
  try {
    const places = await getPlaces();
    // The full places list is ~30k rows and changes at most yearly; let
    // browsers and CDNs cache it instead of re-downloading on every visit.
    return NextResponse.json(
      { places, count: places.length },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load places";
    const status = message.includes("CENSUS_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
