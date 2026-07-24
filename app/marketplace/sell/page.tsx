import { Metadata } from "next";
import { SellForm } from "./SellForm";

export const metadata: Metadata = {
  title: "Sell Your Data — Source Signal Marketplace",
  description: "List your data API or dataset in the Source Signal marketplace.",
};

export default function SellPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Marketplace
      </p>
      <h1 className="font-display mt-3 text-3xl font-bold text-primary">
        Sell your data with Source Signal
      </h1>
      <p className="mt-4 text-muted-foreground">
        We work with a curated set of data providers. Tell us about your product and we'll be in touch
        to discuss listing options — including platform-managed subscriptions and AI agent-compatible APIs.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
        {[
          { label: "Vetted buyers", desc: "Reach data teams and AI agents actively purchasing." },
          { label: "Easy integration", desc: "We help you publish API documentation and pricing." },
          { label: "Admin-controlled", desc: "Every listing is reviewed before it goes live." },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-primary">{item.label}</p>
            <p className="mt-1 text-muted-foreground text-xs">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-primary mb-6">Get in touch</h2>
        <SellForm />
      </div>
    </div>
  );
}
