import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { activeCompaniesFilter } from "@/lib/companies-active";
import type {
  AISearchCriteria,
  AISearchResultsResponse,
  CompanySearchResult,
} from "@/lib/ai-search-types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const criteria = body.criteria as AISearchCriteria | undefined;
    const rawMessages = body.rawMessages; // optional, for saving to session
    if (!criteria || typeof criteria !== "object") {
      return NextResponse.json(
        { error: "criteria object required" },
        { status: 400 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const criteriaBlob = {
      topic: criteria.topic ?? null,
      subject_population: criteria.subject_population ?? null,
      years_dates: criteria.years_dates ?? null,
      ownership: criteria.ownership ?? null,
      data_type: criteria.data_type ?? null,
      data_use: criteria.data_use ?? null,
      geography: criteria.geography ?? null,
      other_details: criteria.other_details ?? null,
    };

    await supabase.from("ai_search_sessions").insert({
      ...criteriaBlob,
      raw_messages: rawMessages ?? null,
    });

    const searchSummary = [
      criteria.topic && `Topic: ${criteria.topic}`,
      criteria.subject_population && `Subject/population: ${criteria.subject_population}`,
      criteria.years_dates && `Years/dates: ${criteria.years_dates}`,
      criteria.ownership && `Ownership: ${criteria.ownership}`,
      criteria.data_type && `Data type: ${criteria.data_type}`,
      criteria.data_use && `Data use: ${criteria.data_use}`,
      criteria.geography && `Geography: ${criteria.geography}`,
      criteria.other_details && `Other: ${criteria.other_details}`,
    ]
      .filter(Boolean)
      .join("\n");
    const summaryPrompt = `You are helping a user find data vendors. Based on the criteria below, write one brief sentence (max 22 words) describing what the user is searching for. Be specific and avoid filler.\n\nCriteria:\n${searchSummary || "No criteria yet."}`;
    let assistantSummary = "Based on your answers, here are the vendors most likely to match your search.";
    try {
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: summaryPrompt }],
        temperature: 0.2,
        max_tokens: 80,
      });
      const summaryText = summaryCompletion.choices[0]?.message?.content?.trim();
      if (summaryText) {
        assistantSummary = summaryText.replace(/^["']|["']$/g, "");
      }
    } catch {
      // fall back to a generic sentence if summary generation fails
    }

    const { data: companies } = await activeCompaniesFilter(
      supabase.from("companies").select("id, name, slug, description, category, subcategory")
    ).order("name");

    if (!companies?.length) {
      const response: AISearchResultsResponse = { assistantSummary, results: [] as CompanySearchResult[] };
      return NextResponse.json(response);
    }

    const topicsPrompt = `Given this data vendor search description, list 3-8 specific topics or keywords that could match vendor categories (e.g. consumer data, B2B, healthcare, geospatial, financial). One per line, short phrases only.\n\nSearch:\n${searchSummary}`;
    const topicsCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: topicsPrompt }],
      temperature: 0.3,
      max_tokens: 200,
    });
    const topicsText = topicsCompletion.choices[0]?.message?.content ?? "";
    const topics = topicsText
      .split("\n")
      .map((t) => t.replace(/^[-*\d.]+\s*/, "").trim())
      .filter(Boolean);

    const candidateCompanies = companies.filter((c) => {
      const text = [c.name, c.description, c.category, c.subcategory]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return topics.some(
        (t) => text.includes(t.toLowerCase()) || t.toLowerCase().split(/\s+/).some((w) => text.includes(w))
      );
    });

    if (candidateCompanies.length === 0) {
      const response: AISearchResultsResponse = {
        assistantSummary,
        results: companies.slice(0, 10).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          category: c.category,
          subcategory: c.subcategory,
          matchReason: "No strong topic match; showing first 10 vendors.",
        })),
      };
      return NextResponse.json(response);
    }

    const vendorList = candidateCompanies
      .map(
        (c, i) =>
          `[${i}] ${c.name}\nCategory: ${c.category ?? ""} / ${c.subcategory ?? ""}\n${c.description ?? ""}`
      )
      .join("\n\n");

    const rankPrompt = `You are matching data vendors to a user's search. Given the search criteria and the list of vendors, return a JSON array of objects with "index" (the [0], [1], ... index from the list) and "reason" (one short sentence why this vendor matches). Sort by best match first. Include only vendors that are at least somewhat relevant; you can omit poor matches. Return only the JSON array, no other text.\n\nSearch criteria:\n${searchSummary}\n\nVendors:\n${vendorList}`;

    const rankCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: rankPrompt }],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const rankText = rankCompletion.choices[0]?.message?.content ?? "[]";
    let ranked: { index: number; reason: string }[] = [];
    try {
      const parsed = JSON.parse(rankText.replace(/```json?\s*|\s*```/g, "").trim());
      ranked = Array.isArray(parsed) ? parsed : [];
    } catch {
      ranked = candidateCompanies.map((_, i) => ({ index: i, reason: "Relevant vendor" }));
    }

    const results: CompanySearchResult[] = ranked.flatMap(({ index, reason }) => {
      const c = candidateCompanies[index];
      if (!c) return [];
      return [{
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        category: c.category,
        subcategory: c.subcategory,
        matchReason: reason,
      }];
    });

    const response: AISearchResultsResponse = { assistantSummary, results };
    return NextResponse.json(response);
  } catch (err) {
    console.error("AI results error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Results failed" },
      { status: 500 }
    );
  }
}
