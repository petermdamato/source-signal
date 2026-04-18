"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Input, MultiselectDropdown } from "@/components/ui";
import { updateCompanyDeliveryAndAttributes, createCustomDataAttribute } from "@/app/actions/company-profile";

type DeliveryMethod = { id: string; name: string };
type AttributeEntry = { id: string; name: string };

type Props = {
  companyId: string;
  companySlug: string;
  companyName: string;
  initialDeliveryIds: string[];
  initialAttributes: AttributeEntry[];
  allDeliveryMethods: DeliveryMethod[];
  publicAttributes: { id: string; name: string }[];
};

export function CompanyProfileForm({
  companyId,
  companySlug,
  companyName,
  initialDeliveryIds,
  initialAttributes,
  allDeliveryMethods,
  publicAttributes,
}: Props) {
  const [deliveryIds, setDeliveryIds] = useState<Set<string>>(new Set(initialDeliveryIds));
  const [attributes, setAttributes] = useState<AttributeEntry[]>(initialAttributes);
  const [attributeInput, setAttributeInput] = useState("");
  const [showAttributeDropdown, setShowAttributeDropdown] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPublicAttributes = attributeInput.trim()
    ? publicAttributes.filter((a) =>
        a.name.toLowerCase().includes(attributeInput.trim().toLowerCase())
      )
    : publicAttributes;

  function toggleDelivery(id: string) {
    setDeliveryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addAttributeById(id: string, name: string) {
    if (attributes.some((a) => a.id === id)) return;
    setAttributes((prev) => [...prev, { id, name }]);
    setAttributeInput("");
    setShowAttributeDropdown(false);
  }

  async function addCustomAttribute() {
    const name = attributeInput.trim();
    if (!name) return;
    const existing = publicAttributes.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      addAttributeById(existing.id, existing.name);
      return;
    }
    const { id, error } = await createCustomDataAttribute(name);
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }
    if (id) addAttributeById(id, name);
  }

  function removeAttribute(id: string) {
    setAttributes((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateCompanyDeliveryAndAttributes(
        companyId,
        companySlug,
        Array.from(deliveryIds),
        attributes.map((a) => a.id)
      );
      if (result.error) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: "Saved." });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-primary mb-3">Delivery method</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Select all delivery methods this vendor supports.
        </p>
        <MultiselectDropdown
          options={allDeliveryMethods.map((dm) => ({ id: dm.id, label: dm.name }))}
          selectedIds={deliveryIds}
          onToggle={toggleDelivery}
          placeholder="Select delivery methods…"
          className="max-w-sm"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-primary mb-3">Attributes</label>
        <p className="text-sm text-muted-foreground mb-3">
          Choose common attributes or enter your own. Custom entries are shown on the profile but not in search.
        </p>
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-2">
            {attributes.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm text-primary"
              >
                {a.name}
                <button
                  type="button"
                  onClick={() => removeAttribute(a.id)}
                  className="text-muted-foreground hover:text-error leading-none"
                  aria-label={`Remove ${a.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <Input
              type="text"
              value={attributeInput}
              onChange={(e) => {
                setAttributeInput(e.target.value);
                setShowAttributeDropdown(true);
              }}
              onFocus={() => setShowAttributeDropdown(true)}
              onBlur={() => setTimeout(() => setShowAttributeDropdown(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const match = filteredPublicAttributes[0];
                  if (match) addAttributeById(match.id, match.name);
                  else addCustomAttribute();
                }
              }}
              placeholder="Type to search or add custom attribute"
              className="pr-24"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={addCustomAttribute}
              disabled={!attributeInput.trim()}
            >
              Add
            </Button>
          </div>
          {showAttributeDropdown && filteredPublicAttributes.length > 0 && (
            <ul
              className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-primary/30 bg-card shadow-md"
              role="listbox"
            >
              {filteredPublicAttributes.slice(0, 50).map((a) => (
                <li
                  key={a.id}
                  role="option"
                  className="px-3 py-2 text-sm text-primary hover:bg-primary/5 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addAttributeById(a.id, a.name);
                  }}
                >
                  {a.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {message && (
        <p
          className={
            message.type === "error"
              ? "text-sm text-error"
              : "text-sm text-primary"
          }
        >
          {message.text}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Link href={`/companies/${companySlug}`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
