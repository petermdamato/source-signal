# Style history

Living log of typography and visual direction decisions for Source Signal. Helps avoid revisiting discarded directions and preserves rationale for future tweaks.

---

## 2026 — Typography iterations

### Manrope + Syne (“distinctive modern”) — retired

**Outcome:** Did not ship as the long-term direction after trial.

**Feedback:**

- **Manrope** as the UI/body sans felt **too quirky** for the product.
- Did **not** convey enough **seriousness** / credibility for a **data vendor directory** and marketplace positioning.

*(Syne was paired for display/logo/major headings.)*

---

### Editorial direction — Plus Jakarta Sans + Newsreader (+ Space Mono mono)

**Outcome:** Current stack as implemented in [`app/layout.tsx`](../app/layout.tsx) and [`app/globals.css`](../app/globals.css).

**Feedback:**

- **Newsreader** looks **great** where it is used (“main” impactful type — headlines, logo wordmark, hero `h1`, primary page titles per `.font-display`).
- Important nuance for future work: in code, **Newsreader is scoped to `.font-display`**, not to the global `body` paragraph text. Body copy and most UI chrome use **Plus Jakarta Sans**. If product intent is “Newsreader as *the* main reading face,” that would mean **widening Newsreader** to more surfaces (carefully, for readability at small sizes)—not implemented only from subjective praise.

---

### Technical note — Do body and buttons use `ui-sans-serif`?

**Not explicitly.** In this codebase:

- **`body`** uses `font-family: var(--font-sans), system-ui, sans-serif` in [`app/globals.css`](../app/globals.css).
- **`--font-sans`** in `@theme` is wired to **`var(--font-plus-jakarta)`**, which **`next/font/google`** injects for **Plus Jakarta Sans** on `<body>`.

So most text and **buttons inherit Plus Jakarta Sans**, not Tailwind’s abstract `font-sans`/`ui-sans-serif` token unless a component overrides it.

**Why it can still *feel* like generic system UI:**

1. **Plus Jakarta Sans** is a neutral, widely used UI sans—often *reads* similarly to Inter / system stacks at small sizes.
2. **Newsreader** only appears where **`font-display`** is applied (titles, brand, etc.), so the bulk of paragraphs, labels, inputs, and buttons stays in the sans—contrast makes the sans band feel “default.”
3. **Fallback:** If webfonts are slow or blocked, the cascade falls through to **`system-ui, sans-serif`**, which *is* close to generic OS chrome.

---

## Related files

| Concern | Location |
|---------|----------|
| Font loading | [`app/layout.tsx`](../app/layout.tsx) |
| Tokens, `.font-display`, body stack | [`app/globals.css`](../app/globals.css) |
| Agent-facing summary | [`.cursor/rules/design-rules.mdc`](../.cursor/rules/design-rules.mdc) |
