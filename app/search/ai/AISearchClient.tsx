"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import type {
  AISearchCriteria,
  AISearchResultsResponse,
  ChatMessage,
  CompanySearchResult,
} from "@/lib/ai-search-types";

const INITIAL_ASSISTANT = "What are you searching for?";

function BouncingDots() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[#EAF0F4] px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[#6C8494] animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.7s" }}
        />
      ))}
    </div>
  );
}

export function AISearchClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_ASSISTANT },
  ]);
  const [criteria, setCriteria] = useState<AISearchCriteria>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResultsButton, setShowResultsButton] = useState(false);
  const [results, setResults] = useState<CompanySearchResult[] | null>(null);
  const [resultsSummary, setResultsSummary] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [typingChars, setTypingChars] = useState(0);
  const prevCountRef = useRef(messages.length);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const userAnswerCount = messages.filter((m) => m.role === "user").length;
  const canShowResults = showResultsButton || userAnswerCount >= 2;

  function scrollChatToBottom() {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") {
        setTypingIndex(messages.length - 1);
        setTypingChars(0);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (typingIndex === null) return;
    const fullText = messages[typingIndex]?.content ?? "";
    if (typingChars >= fullText.length) { setTypingIndex(null); return; }
    const speed = fullText.length > 120 ? 10 : 16;
    const step = fullText.length > 200 ? 3 : 2;
    const timer = setTimeout(() => setTypingChars((c) => Math.min(c + step, fullText.length)), speed);
    return () => clearTimeout(timer);
  }, [typingIndex, typingChars, messages]);

  useEffect(() => { scrollChatToBottom(); }, [messages, loading]);

  useEffect(() => {
    if (typingIndex !== null && typingChars % 12 === 0) scrollChatToBottom();
  }, [typingChars, typingIndex]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMessage]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], criteria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setCriteria(data.criteria ?? criteria);
      setShowResultsButton(!!data.showResultsButton || userAnswerCount + 1 >= 2);
      setMessages((m) => [...m, { role: "assistant", content: data.assistantMessage }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleShowResults() {
    setResultsLoading(true);
    setError(null);
    setResults(null);
    setResultsSummary(null);
    try {
      const res = await fetch("/api/search/ai/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, rawMessages: messages }),
      });
      const data = (await res.json()) as AISearchResultsResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResultsSummary(data.assistantSummary ?? null);
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setResultsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ai-fade-in { animation: fadeSlideIn 0.28s ease-out both; }
      `}</style>

      <div className="space-y-6">
        {/* Chat panel */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#6C8494]/25 bg-white shadow-sm">
          <div className="border-b border-[#6C8494]/15 bg-[#EAF0F4] px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-[#2C4C5C]">Guided vendor search</p>
            <p className="mt-1 text-xs text-[#6C8494]">
              Share details in your own words. You can view matches after two answers.
            </p>
          </div>

          <div ref={scrollContainerRef} className="h-[300px] space-y-4 overflow-y-auto p-4 sm:h-[420px] sm:p-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-fade-in ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}
              >
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[86%] rounded-2xl rounded-br-md bg-[#2C4C5C]/12 px-4 py-3 text-sm leading-relaxed text-[#2C4C5C] sm:text-[15px]"
                      : "max-w-[86%] rounded-2xl rounded-bl-md bg-[#EAF0F4] px-4 py-3 text-sm leading-relaxed text-[#2C4C5C] sm:text-[15px]"
                  }
                >
                  {msg.role === "assistant" && typingIndex === i ? (
                    <>
                      {msg.content.slice(0, typingChars)}
                      <span className="ml-px inline-block h-[1.1em] w-[2px] animate-pulse bg-[#6C8494]/60 align-text-bottom" />
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start ai-fade-in">
                <BouncingDots />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#6C8494]/15 bg-[#f4f7f9] p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your answer…"
              disabled={loading}
              className="h-11 flex-1 rounded-xl px-4 text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-11 min-w-[120px] rounded-xl px-5"
            >
              Send
            </Button>
          </div>
        </div>

        {/* Show-results CTA */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            canShowResults && !results
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#6C8494]/25 bg-[#EAF0F4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-[#2C4C5C]">
                Ready when you are. Generate matches from your current answers.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleShowResults}
                disabled={resultsLoading || loading}
                className="w-full shrink-0 rounded-xl bg-[#d4a017] text-[#2C4C5C] hover:bg-[#b88a12] border-[#b88a12] px-6 sm:w-auto"
              >
                {resultsLoading ? "Finding vendors…" : "Show me results"}
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="ai-fade-in rounded-xl border border-[#E05A48]/25 bg-[#E05A48]/8 px-4 py-3 text-sm text-[#E05A48]">
            {error}
          </p>
        )}

        {/* Results */}
        {results && (
          <section className="ai-fade-in rounded-2xl border border-[#6C8494]/20 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-[#2C4C5C]">
              Vendors that match your search
            </h2>
            {resultsSummary && (
              <p className="mt-2 rounded-xl border border-[#6C8494]/20 bg-[#EAF0F4] px-4 py-3 text-sm text-[#2C4C5C]">
                {resultsSummary}
              </p>
            )}
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {results.length === 0 ? (
                <li className="rounded-xl border border-[#6C8494]/25 bg-[var(--card)] p-4 text-[#6C8494] sm:col-span-2">
                  No vendors matched. Try broadening your criteria or browse all vendors.
                </li>
              ) : (
                results.map((c, idx) => (
                  <li
                    key={c.id}
                    className="ai-fade-in rounded-xl border border-[#6C8494]/20 bg-white p-4 transition-shadow hover:shadow-sm hover:border-[#6C8494]/40"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <Link
                      href={`/companies/${c.slug}`}
                      className="font-medium text-[#2C4C5C] hover:underline"
                    >
                      {c.name}
                    </Link>
                    {(c.category || c.subcategory) && (
                      <p className="mt-1 text-xs text-[#6C8494]">
                        {[c.category, c.subcategory].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {c.description && (
                      <p className="mt-2 text-sm text-[#2C4C5C] line-clamp-2">{c.description}</p>
                    )}
                    {c.matchReason && (
                      <p className="mt-2 text-xs text-[#6C8494]">{c.matchReason}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
