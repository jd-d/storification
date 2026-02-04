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
<script src="vocab-data.js"></script>
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
