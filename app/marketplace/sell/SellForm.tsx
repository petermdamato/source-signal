"use client";

import { useActionState } from "react";
import { submitVendorInterest, VendorInterestState } from "@/app/actions/vendor-interest";
import { Button, Input } from "@/components/ui";

const initialState: VendorInterestState = {};

export function SellForm() {
  const [state, formAction, pending] = useActionState(submitVendorInterest, initialState);

  if (state.ok) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-lg font-semibold text-primary">Thanks! We'll be in touch.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We review every application and will reach out to discuss listing options.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-primary mb-1" htmlFor="company_name">
            Company name <span className="text-error">*</span>
          </label>
          <Input id="company_name" name="company_name" required placeholder="Acme Data Co." />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1" htmlFor="website_url">
            Website
          </label>
          <Input id="website_url" name="website_url" type="url" placeholder="https://acme.com" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-primary mb-1" htmlFor="contact_name">
            Your name
          </label>
          <Input id="contact_name" name="contact_name" placeholder="Jane Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1" htmlFor="contact_email">
            Work email <span className="text-error">*</span>
          </label>
          <Input id="contact_email" name="contact_email" type="email" required placeholder="jane@acme.com" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-1" htmlFor="description">
          Tell us about your data product
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What data do you provide? Who are your current customers? How is the API structured?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </div>

      {state.error && (
        <p className="text-sm text-error">{state.error}</p>
      )}

      <Button type="submit" variant="accent" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send application"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        We review applications within 2–3 business days.
      </p>
    </form>
  );
}
