import { AISearchClient } from "./AISearchClient";

export const metadata = {
  title: "Search vendors with AI – Source Signal",
  description: "Describe what data you need and we’ll match you with vendors.",
};

export default function AISearchPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-primary/[0.04] p-6 shadow-sm sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Search vendors with AI
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Answer a few short questions and we’ll match you with vendors that fit your exact data needs.
        </p>
        <div className="mt-8">
          <AISearchClient />
        </div>
      </div>
    </div>
  );
}
