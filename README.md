# Storification
Storification is a static, single‑page site that hosts interactive stories and learning tools (like the vocab trainer). Everything is built with plain HTML/CSS/JS and runs fully in the browser.

## Project Structure
- `index.html`: Main landing page with links to stories/tools.
- `assets/`: Shared CSS, JS, images, and icons used across pages.
- `stories/`: Individual story/tools, each in its own folder.
- `manifest.json`: PWA manifest (site can be installed).

## Running Locally
Open `index.html` in a browser or serve the repo with any static server.

## Deployment (GitHub Pages)
Deployment is handled by GitHub Actions in `.github/workflows/` and publishes to the `gh-pages` branch.

### Production (main)
- **Trigger**: push to `main` (also `work` builds but only `main` deploys prod).
- **Build**: the workflow copies the repo into `dist/` and excludes:
  - `.git/`, `.github/`, `node_modules/`, `dist/`, `*.yml`, `*.yaml`, and `README.md`
- **Publish**: `dist/` is pushed to the root of `gh-pages`.
- **No Jekyll**: a `.nojekyll` file is added so GitHub Pages serves files directly.

### Pull Request previews
- **Trigger**: `pull_request_target`
- **Publish**: the same build is deployed to:
  ```
  gh-pages/previews/pr-<PR_NUMBER>/
  ```
- **Preview URL**:
  ```
  https://<owner>.github.io/<repo>/previews/pr-<PR_NUMBER>/
  ```
- A GitHub Actions bot comment posts the preview URL on the PR.
- When the PR is closed, `.github/workflows/cleanup-preview.yml` removes the preview folder and updates the comment.

## Stories & Pages
Each story/tool is self‑contained:
- `stories/<story-name>/index.html`: The actual page.
- Optional data or helper files next to it (e.g., vocab lists).

To add a new story/tool:
1. Create a folder in `stories/`.
2. Add an `index.html` inside.
3. Link it from the root `index.html`.

## Print Preview For Stories
There is a shared print preview system for story pages that need printable, paginated output.

Current shared files:
- `assets/js/print-preview.js`: opens the preview UI, reads the page content, applies tuning controls, and asks Paged.js to repaginate.
- `assets/css/print-preview.css`: styles the preview overlay, page guides, chunk controls, and print-preview UI.
- `assets/js/paged.js`: vendored Paged.js runtime used for in-browser pagination.

Current story using it:
- `stories/hannibal-de-eed/index.html`

### How It Is Supposed To Work
When a story page includes the shared preview assets, a floating `Print Preview` button appears. Clicking it should:

1. Hide the normal story view.
2. Open the preview overlay.
3. Rebuild the story content into a paginated preview using Paged.js.
4. Let the user tune layout before printing.

The controls are intended to behave like this:
- `Font size`: scale story typography in the preview.
- `Line height`: change line spacing for story text.
- `Spacing`: change vertical spacing between story blocks.
- `Image scale`: shrink or enlarge story image blocks.
- `Page margins`: change real print margins through `@page`.
- `Show footer: Pagina X van Y`: toggle printable page numbering.
- `Start page here`: force a selected content block to begin on a new page.
- `Keep this block together`: avoid splitting that block across pages where possible.

### Required Markup Hooks
For the shared preview to work correctly, the story page should provide:

- An outer content root, currently `#document-root`.
- Addressable content blocks marked with `.story-chunk` and a unique `data-chunk-id`.
- The preview asset includes near the end of the page.

In `stories/hannibal-de-eed/index.html`, this currently means:
- The story content is wrapped in `<article id="document-root" class="card">`.
- Printable/editable blocks such as headings, dialogue boxes, lore panels, and image blocks are marked as `.story-chunk`.
- The page loads `../../assets/css/print-preview.css?v=4` and `../../assets/js/print-preview.js?v=4`.

### Page-Break Model
The preview uses Paged.js for the actual pagination rules. The custom JS/UI layer is only there to make those rules easier to control.

The intended behavior is:
- Paged.js decides page layout.
- The preview UI stores per-block rules in JS state.
- Those rules are applied back onto the cloned story content using CSS break properties such as `break-before` and `break-inside`.
- Re-rendering the preview should visibly move content between pages when a break rule changes.

### If You Reuse This On Another Story
To add the same print-preview behavior to another story page:

1. Include `assets/css/print-preview.css` and `assets/js/print-preview.js`.
2. Wrap the printable content in a stable root like `#document-root`.
3. Add `.story-chunk` plus unique `data-chunk-id` values to any block the preview should target for spacing, keep-together, or forced page starts.
4. Verify the page’s own CSS does not hard-lock heights or overflow in a way that prevents repagination.

### Current Note
This print-preview flow is still being refined. The intended behavior is documented here, but if the live preview differs from that behavior, treat the code in `assets/js/print-preview.js` and `stories/hannibal-de-eed/index.html` as the source of truth for the current implementation state.

## Vocab Trainer (Generic)
The vocab trainer lives here:
- `stories/vocabtrainer/index.html`

It supports:
- Multiple vocab lists (datasets) chosen by the user.
- Per‑dataset persistence (progress, known words, mnemonics).
- On‑the‑fly “master list” overwrite (still available).
- Import/export of unknown words (with optional mnemonics).
- Shuffle, reveal modes, auto‑remove known words, etc.

### Dataset Format
Each line in a list uses TAB separation:
```
language1<TAB>language2<TAB>optional_mnemonic1|optional_mnemonic2|optional_mnemonic3
```
The 3rd column is optional and may contain multiple mnemonics separated by `|`.

Example:
```
rosa<TAB>roos<TAB>Roos klinkt als rose|Denk aan een roos
```

### Adding a New Vocab List
Create a dataset file (e.g. `stories/vocabtrainer/vocab-latin-nl.js`) that registers itself:
```js
window.VOCAB_DATASETS = window.VOCAB_DATASETS || [];
window.VOCAB_DATASETS.push({
  id: "lat-nl",
  label: "Latijn -> Nederlands",
  language1: "Latijn",
  language2: "Nederlands",
  showTransliteration: false,
  data: `...your tab-separated lines...`
});
```

Then include it in the vocab trainer page (before the inline script):
```html
<script src="vocab-greek-nl-lessen-2-tot-16.js"></script>
<script src="vocab-latin-nl.js"></script>
```

The dropdown in the UI will automatically include all datasets.

### Per‑Dataset Storage
LocalStorage keys are dataset‑scoped (session/known/auto‑remove/mnemonics/master list).
The Greek dataset keeps legacy keys so existing users keep their progress.

### Master List Override (Per Dataset)
The “Masterlijst” overwrite still works. It replaces the currently selected dataset’s list only.

## PWA Notes
This repo is PWA‑ready:
- `manifest.json` is included at the root.
- Icons live under `assets/` and are linked from `index.html`.
- A `.nojekyll` file is created during deploy to keep file paths intact.

If you want full offline support, you can add a service worker and cache strategy.

## Where Expansion Is Possible
- **More stories/tools**: Add new folders under `stories/`.
- **More datasets**: Add new `vocab-*.js` files and script tags.
- **UI branding**: Update `assets/css/style.css` or the header in story pages.
- **PWA**: Extend `manifest.json` and icons in `assets/`.
- **Data import/export**: Expand import parsing or add new export formats.

If you want the vocab trainer to split into reusable modules, the inline script in
`stories/vocabtrainer/index.html` can be moved to a dedicated JS file.
