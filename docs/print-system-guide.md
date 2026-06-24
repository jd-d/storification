# Print system implementation guide

A self-contained recipe for making any HTML page print beautifully, the way the
Storification project does it. There are **two modes** — pick one per page:

| | **Mode A — Print Tweak Mode** | **Mode B — Paged.js Print Preview** |
|---|---|---|
| Best for | Short, **single-sheet** printables (cheat sheets, one-pagers) | **Multi-page** documents (long readings, stories) |
| Pagination | Native browser print | Paged.js re-lays content into real page boxes in the DOM |
| Controls | One floating button → font / columns / margins / line-height | Full sidebar: global sliders + **per-page** overrides + forced page breaks |
| Top/bottom margins | ⚠️ only repeat on first/last page (CSS fragmentation limit) | ✅ true per-page margins (baked as real padding, survive Save-as-PDF) |
| Page numbers / verified breaks | ✗ | ✅ |
| Machinery | ~80 lines inline, no dependencies | Vendored Paged.js (~33k lines) + the shared engine files |
| Cost | Tiny, instant | Heavier; re-paginates on each global change (visible delay) |

**Rule of thumb:** single page that just needs to fit nicely → **Mode A**. Anything
multi-page where margins, page numbers, or where-the-break-lands actually matter
→ **Mode B**. They are not mutually exclusive across a site — choose per page.

Background: Paged.js implements the **W3C CSS Paged Media** spec in-browser (same
category as Prince XML / WeasyPrint). It is the closest thing to a "client-side
PDF layout engine" that works on a static site with no build step. Low-level JS
PDF libs (jsPDF, pdf-lib) only draw at x/y with no HTML/CSS flow; Ghostscript is
a PDF interpreter, not a layout engine; headless-Chrome `page.pdf()` is stronger
but needs a Node build step (out of scope for a static site).

---

## Mode A — Print Tweak Mode (simple, single page)

A floating button reveals a toolbar that live-adjusts **CSS custom properties**
on `<html>`; the page's styles read those properties. State persists in
`localStorage`; the toolbar never prints. Canonical examples in this repo:
`stories/delphi-orakel-van-delphi/index.html` and
`stories/vocabtrainer/vocab-greek-nl-print-all.html`.

### Recipe

1. **Declare tweakable properties on `<html>`** and a print page box:

```html
<html lang="nl" style="--tweak-font-size: 16px; --tweak-margin-x: 26px;
  --tweak-margin-top: 26px; --tweak-margin-bottom: 26px; --tweak-line-height: 1.6;">
```
```css
@page { size: A4; margin: 0; }   /* margin:0 — we control margins via padding */
```

2. **Drive layout from the properties.** Put the content in one wrapper whose
   padding is the margin, and reference the vars wherever they apply:

```css
.sheet {
  padding: var(--tweak-margin-top) var(--tweak-margin-x) var(--tweak-margin-bottom);
  max-width: 880px; margin: 0 auto;
}
main { font-size: var(--tweak-font-size); line-height: var(--tweak-line-height); }
/* multi-column cheat sheets: column-count: var(--tweak-columns); etc. */
```

3. **Add the floating launcher + toolbar** (a `<button>` and an `<aside>` of
   `+/-` steppers, `position: fixed`). On each step, clamp the value, write it
   with `document.documentElement.style.setProperty('--tweak-...', v)`, and save
   to `localStorage`. A `Print` button just calls `window.print()`. See the
   `makeToolbar()` IIFE in `delphi-orakel-van-delphi/index.html` for a complete,
   copy-pasteable implementation (~80 lines).

4. **Hide the UI when printing:**

```css
@media print {
  .print-tweak-launcher, .print-tweak-toolbar, nav.toc { display: none !important; }
  main { box-shadow: none; }
}
```

### The one nuance to remember
`padding-left/right` repeats on every printed line, so **left/right margins are
reliable on every page**. But `padding-top/bottom` on a box that fragments
across pages renders **only once** — top of page 1, bottom of the last page.
Middle pages get zero top/bottom margin, and `@page` margins are unreliable
across print / Save-as-PDF. If you need real per-page top/bottom margins, that
is exactly what Mode B exists for.

---

## Mode B — Paged.js Print Preview (multi-page, full control)

### Files (the only dependencies)
All three live together; `print-preview.js` loads `paged.js` on demand from its
own directory, so keep them side by side:

- `assets/css/print-preview.css` — overlay UI + page styling
- `assets/js/print-preview.js` — the engine (auto-inits)
- `assets/js/paged.js` — vendored Paged.js (never edit)

Include on the page:
```html
<link rel="stylesheet" href="../../assets/css/print-preview.css">
<script src="../../assets/js/print-preview.js" defer></script>
```
(Adjust the relative depth. `print-preview.js` derives the Paged.js path from
its own `src`, so any depth works.)

### Content contract (this is the whole integration)
1. Wrap the on-screen page in **`.page-wrapper`** (hidden while the preview
   overlay is open).
2. Put the **printable content root** in **`id="document-root"`**, inside the
   wrapper. Anything in `.page-wrapper` but outside `#document-root` (e.g. a
   table-of-contents nav) is shown on screen but **excluded from print**.
3. Tag each block that may start a new page with
   **`class="story-chunk" data-chunk-id="unique-id"`**. These ids must be
   unique and stable (kebab-case). They drive: the force-break controls, the
   per-page break list, and scroll-position preservation.

```html
<div class="sheet page-wrapper">
  <nav class="toc">…on-screen only…</nav>
  <main id="document-root">
    <h2 class="chapter-title story-chunk" data-chunk-id="title-ch1">Chapter 1</h2>
    <div class="reading story-chunk" data-chunk-id="reading-ch1">…</div>
  </main>
</div>
```

That's it — a floating **"Print Preview"** button auto-appears (the engine
inits on `DOMContentLoaded` if `#document-root` or `.page-wrapper` exists).

### What the user gets, for free
- **Global sliders:** font %, line-height, block spacing, image scale, page size
  (A4 P/L, Letter P/L), all-margins + advanced per-side margins, footer page
  numbers ("Pagina X van Y").
- **Per-page tweaks:** a "⚙ Tweak page N" button on every rendered page opens a
  popover to override that one page's font / line-height / spacing / margins —
  applied as **instant CSS, no re-pagination**. Used to grow a short page's
  content into the gap a forced break left. Per-page panels **start from the
  current global settings** (so the page doesn't jump on first nudge) and are
  **cleared whenever the document re-paginates** (page boundaries move).
- **Forced page breaks:** per-chunk "Break before" dropdown in the sidebar, and
  a **"Start page here"** button on each block in the preview ("Reset page break"
  to clear). Keeps a heading with its content by starting it on a fresh page.
- **Resizable sidebar** (drag the handle; double-click to reset).
- **Scroll preservation:** changing a setting or forcing a break keeps you at the
  same place in the document instead of jumping to the top.
- A **Print** button (just `window.print()`; the overlay chrome is hidden in
  `@media print`).

### Page-local fragmentation CSS the author should add
Paged.js honours the CSS Fragmentation spec (unlike native print), and the
page's own `<style>` flows into Paged.js via the engine's `collectDocStyles()`.
So add the standard print rules in the page itself:

```css
/* keep a heading glued to what follows it */
h2, h3, .reading-title { break-after: avoid; page-break-after: avoid; }
h2, h3, .reading-title { break-inside: avoid; page-break-inside: avoid; }
/* let a long table flow, but never split a row */
table.my-table tr { break-inside: avoid; page-break-inside: avoid; }
```

---

## Mode B gotchas (hard-won — read before debugging)

1. **Forced breaks must be a stylesheet rule, not an inline style.** This
   Paged.js only reads break rules from stylesheets (it rewrites them into
   `data-break-before` attributes its layout engine reads); it ignores inline
   `style.breakBefore` and computed style for breaks. The engine handles this
   correctly now via `buildChunkBreakCSS()` — but if you add new break behaviour,
   emit it as CSS (`.story-chunk[data-chunk-id="X"]{break-before:page}`), never
   inline.

2. **Paged.js ignores `break-before: avoid` on a `<table>`.** It paginates
   tables row-by-row, so a heading immediately before a long table can still
   strand on the previous page. The reliable fix is to **start the passage on a
   fresh page** via the force-break control, not `break-before: avoid`.

3. **Per-page font/line-height/spacing overrides** reuse the engine's `--pp-*`
   variables and must be set on **both** `.pagedjs_page[data-page-number="N"]
   .pagedjs_page_content` **and** `… .pp-preview-root` — because some content
   nests inside `.pp-preview-root` (which re-declares the vars) while other
   content does not after fragmentation. Margins reuse Paged.js's own
   `--pagedjs-margin-*` on `.pagedjs_pagebox` (with `!important`).

4. **Global font/spacing scaling only reaches elements the engine's CSS
   targets.** `buildPagedCSS()` scales `p, li, td` and a few named components
   with `calc(<size> * var(--pp-font-scale))`. Headings and bespoke blocks won't
   scale unless they either size in `em` relative to a scaled ancestor, or you
   add matching `calc(… * var(--pp-font-scale))` rules (in the page CSS or
   `print-preview.css`).

5. **Re-pagination is multi-pass.** Paged.js renders progressively and reflows
   when web fonts finish loading; transient intermediate page counts are normal.
   If you script/test against it, wait until the page count is **stable** and the
   loading spinner is gone, not just non-zero. A recurring `checkUnderflowAfterResize`
   console error from Paged.js on re-render is pre-existing noise, not a bug in
   the integration.

6. **Keep all preview-only chrome inside `@media print { display:none }`.** That
   includes the toolbar/sidebar, the per-page tweak button/panel, the
   "Start page here" buttons, the resize handle, and the `.pagedjs_page::before`
   / `::after` page labels — otherwise they leak into the printout.

---

## Quick decision checklist
- One page, just needs to fit / look tidy → **Mode A** (inline, no deps).
- Multi-page, needs real margins / page numbers / break control → **Mode B**
  (include the 3 files, add `#document-root` + `.story-chunk` markup, add
  fragmentation CSS).
- Building a reusable skill from this: ship the 3 Mode-B files as assets, and
  the Mode-A pattern as a snippet; the integration surface for Mode B is just
  the **content contract** (`#document-root`, `.page-wrapper`, `story-chunk`
  ids) plus the fragmentation CSS.
