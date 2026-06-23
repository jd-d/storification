/**
 * Print Preview System
 * Interactive pre-print layout tuning layer for HTML/CSS documents.
 * Uses Paged.js for in-browser pagination.
 *
 * Usage:
 *   <link rel="stylesheet" href="/assets/css/print-preview.css">
 *   <script src="/assets/js/print-preview.js" defer></script>
 *
 * The script auto-initialises on DOMContentLoaded.
 * It looks for an <article id="document-root"> (or the first .page-wrapper).
 * Content blocks should carry class="story-chunk" data-chunk-id="…".
 */
(function () {
  'use strict';

  /* ========== constants ========== */
  // Derive base path from this script's own src so it works at any depth
  const SCRIPT_BASE = (function () {
    const tag = document.currentScript || qs('script[src*="print-preview"]');
    if (tag && tag.src) {
      return tag.src.substring(0, tag.src.lastIndexOf('/') + 1);
    }
    return '../../assets/js/';  // fallback
  })();
  const PAGEDJS_SRC = SCRIPT_BASE + 'paged.js';

  /* ========== state ========== */
  const state = {
    active: false,
    fontSize: 100,     // %
    lineHeight: 150,   // % → 1.5
    imageScale: 100,   // %
    spacing: 100,      // %
    marginAll: 15,     // mm
    marginTop: 15,     // mm
    marginRight: 15,   // mm
    marginBottom: 15,  // mm
    marginLeft: 15,    // mm
    pageSize: 'A4P',   // A4P | A4L | LTP | LTL
    showPageNumbers: false,
    chunkBreaks: {},   // chunkId → { breakBefore: string|null, keepTogether: bool }
    draggedBreakChunkId: null,
    renderedPageCount: 0,
    pagedLoaded: false,
    rendering: false,
    // Per-page tweaks: pageNumber (1-based, as string) → overrides for ONE
    // rendered page. Applied as instant CSS (no re-pagination) by overriding
    // the same --pp-* variables the global sliders use, scoped to that page.
    // Cleared on every re-pagination because page boundaries shift (see
    // renderPages). Shape: { fontScale, lineHeight, spacing, marginTop,
    // marginRight, marginBottom, marginLeft } — all optional.
    pageTweaks: {},
    pageTweaksClearedNotice: false,
  };

  // Defaults a per-page tweak inherits from until the user changes a control.
  // Matches the global defaults so opening a page's panel shows neutral values.
  const PAGE_TWEAK_DEFAULTS = {
    fontScale: 100,    // % (→ --pp-font-scale)
    lineHeight: 150,   // % (→ --pp-line-height)
    spacing: 100,      // % (→ --pp-spacing-scale)
    marginTop: 15,     // mm
    marginRight: 15,   // mm
    marginBottom: 15,  // mm
    marginLeft: 15,    // mm
  };

  /* ========== helpers ========== */
  const qs  = (s, p) => (p || document).querySelector(s);
  const qsa = (s, p) => [...(p || document).querySelectorAll(s)];

  const PAGE_DIMS = {
    A4P:  { width: '210mm',  height: '297mm'  },
    A4L:  { width: '297mm',  height: '210mm'  },
    LTP:  { width: '8.5in',  height: '11in'   },
    LTL:  { width: '11in',   height: '8.5in'  },
  };

  const BREAK_BEFORE_OPTIONS = [
    { value: '', label: 'No forced break' },
    { value: 'page', label: 'Start on next page' },
    { value: 'left', label: 'Start on left page' },
    { value: 'right', label: 'Start on right page' },
    { value: 'recto', label: 'Start on recto page' },
    { value: 'verso', label: 'Start on verso page' },
  ];

  /* ========== load Paged.js on demand ========== */
  function loadPagedJS() {
    if (state.pagedLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PAGEDJS_SRC;
      s.onload = () => { state.pagedLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('Failed to load Paged.js'));
      document.head.appendChild(s);
    });
  }

  let previewHandlerRegistered = false;

  function registerPreviewHandler() {
    if (previewHandlerRegistered || !window.Paged || !window.Paged.Handler || !window.Paged.registerHandlers) {
      return;
    }

    class PreviewMetaHandler extends window.Paged.Handler {
      afterPageLayout(pageElement, page) {
        if (!pageElement || !page) return;
        pageElement.dataset.pageNumber = String(page.position + 1);
      }

      afterRendered(pages) {
        state.renderedPageCount = pages ? pages.length : 0;
      }
    }

    window.Paged.registerHandlers(PreviewMetaHandler);
    previewHandlerRegistered = true;
  }

  /* ========== build overlay UI ========== */
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'pp-overlay';
    overlay.innerHTML = `
      <div class="pp-toolbar">
        <span class="pp-toolbar-title">Print Preview</span>
        <div class="pp-toolbar-actions">
          <button class="pp-btn pp-btn-toggle-sidebar" title="Show/hide controls">&#9776;</button>
          <button class="pp-btn pp-btn-print" title="Send to printer (Ctrl+P)">&#128424; Print</button>
          <button class="pp-btn pp-btn-exit" title="Back to normal view (Esc)">&#10005; Exit</button>
        </div>
      </div>
      <div class="pp-main">
        <aside class="pp-sidebar">
          <div class="pp-hint">
            Paged.js is handling the pagination. The controls below change the content size and spacing, and you can force a new page before any block from the list or directly on the preview pages.
          </div>

          <hr class="pp-divider">
          <h3>Text &amp; Spacing</h3>

          <label>Font size <span class="pp-val" data-for="fontSize">${state.fontSize}%</span></label>
          <p class="pp-desc">Make all text larger or smaller</p>
          <input type="range" min="70" max="130" value="${state.fontSize}" data-tweak="fontSize">

          <label>Line height <span class="pp-val" data-for="lineHeight">${(state.lineHeight / 100).toFixed(1)}</span></label>
          <p class="pp-desc">Space between lines of text</p>
          <input type="range" min="100" max="220" step="5" value="${state.lineHeight}" data-tweak="lineHeight">

          <label>Spacing <span class="pp-val" data-for="spacing">${state.spacing}%</span></label>
          <p class="pp-desc">Gaps between content blocks</p>
          <input type="range" min="40" max="160" value="${state.spacing}" data-tweak="spacing">

          <hr class="pp-divider">
          <h3>Images</h3>

          <label>Image scale <span class="pp-val" data-for="imageScale">${state.imageScale}%</span></label>
          <p class="pp-desc">Shrink images to save space</p>
          <input type="range" min="30" max="100" value="${state.imageScale}" data-tweak="imageScale">

          <hr class="pp-divider">
          <h3>Paper</h3>
          <select class="pp-select" data-tweak="pageSize">
            <option value="A4P" ${state.pageSize === 'A4P' ? 'selected' : ''}>A4 Portrait</option>
            <option value="A4L" ${state.pageSize === 'A4L' ? 'selected' : ''}>A4 Landscape</option>
            <option value="LTP" ${state.pageSize === 'LTP' ? 'selected' : ''}>Letter Portrait</option>
            <option value="LTL" ${state.pageSize === 'LTL' ? 'selected' : ''}>Letter Landscape</option>
          </select>

          <label>Page margins <span class="pp-val" data-for="marginAll">${state.marginAll}mm</span></label>
          <p class="pp-desc">Increase for more white space around the page, decrease to fit more content.</p>
          <input type="range" min="5" max="35" value="${state.marginAll}" data-tweak="marginAll">

          <details class="pp-advanced-group">
            <summary>Advanced page margins</summary>

            <label>Top <span class="pp-val" data-for="marginTop">${state.marginTop}mm</span></label>
            <input type="range" min="5" max="40" value="${state.marginTop}" data-tweak="marginTop" data-margin-side="top">

            <label>Right <span class="pp-val" data-for="marginRight">${state.marginRight}mm</span></label>
            <input type="range" min="5" max="40" value="${state.marginRight}" data-tweak="marginRight" data-margin-side="right">

            <label>Bottom <span class="pp-val" data-for="marginBottom">${state.marginBottom}mm</span></label>
            <input type="range" min="5" max="40" value="${state.marginBottom}" data-tweak="marginBottom" data-margin-side="bottom">

            <label>Left <span class="pp-val" data-for="marginLeft">${state.marginLeft}mm</span></label>
            <input type="range" min="5" max="40" value="${state.marginLeft}" data-tweak="marginLeft" data-margin-side="left">
          </details>

          <label class="pp-checkbox-row">
            <input type="checkbox" data-tweak="showPageNumbers" ${state.showPageNumbers ? 'checked' : ''}>
            <span>Show footer: Pagina X van Y</span>
          </label>

          <hr class="pp-divider">
          <h3>Force page breaks</h3>
          <p class="pp-desc">Choose a break mode per block. Drag a forced break marker in the preview to move that start-of-page rule.</p>
          <div class="pp-chunk-list" id="ppChunkList"></div>

          <hr class="pp-divider">
          <button class="pp-btn-reset" id="ppReset">Reset All</button>
        </aside>
        <div class="pp-preview-area" id="ppPreviewArea">
          <div class="pp-loading"><div class="pp-spinner"></div>Rendering pages&hellip;</div>
        </div>
      </div>
      <div class="pp-status">
        <span id="ppPageCount">-</span>
        <span id="ppDims">-</span>
      </div>
    `;
    return overlay;
  }

  /* ========== extract & clean content for Paged.js ========== */
  function prepareContent() {
    // find the content root
    const root = qs('#document-root') || qs('.page-wrapper .card') || qs('.page-wrapper');
    if (!root) throw new Error('No content root found');

    const clone = root.cloneNode(true);
    const previewRoot = document.createElement('div');
    previewRoot.className = 'pp-preview-root';

    // unwrap .print-page wrappers — keep children
    qsa('.print-page', clone).forEach(pp => {
      while (pp.firstChild) pp.parentNode.insertBefore(pp.firstChild, pp);
      pp.remove();
    });

    // remove spacers
    qsa('.spacer', clone).forEach(s => s.remove());

    // Per-chunk overrides. The actual page break is driven by a STYLESHEET rule
    // (buildChunkBreakCSS) because Paged.js ignores inline break-before; here we
    // only tag the chunk for the preview's visual break marker and apply
    // keep-together (break-inside IS read from computed style, so inline works).
    qsa('.story-chunk', clone).forEach(ch => {
      const id = ch.dataset.chunkId;
      const chunkRules = id ? state.chunkBreaks[id] : null;
      if (chunkRules?.breakBefore) {
        ch.classList.add('pp-break-before');
      }
      if (chunkRules?.keepTogether) {
        ch.style.setProperty('break-inside', 'avoid');
        ch.style.setProperty('page-break-inside', 'avoid');
      }
    });

    while (clone.firstChild) {
      previewRoot.appendChild(clone.firstChild);
    }

    return previewRoot;
  }

  /* ========== build CSS for Paged.js ========== */
  function buildPagedCSS() {
    const dim = PAGE_DIMS[state.pageSize] || PAGE_DIMS.A4P;
    const fs  = state.fontSize / 100;
    const lh  = state.lineHeight / 100;
    const img = state.imageScale / 100;
    const sp  = state.spacing / 100;

    return `
      @page {
        size: ${dim.width} ${dim.height};
        margin-top: ${state.marginTop}mm;
        margin-right: ${state.marginRight}mm;
        margin-bottom: ${state.marginBottom}mm;
        margin-left: ${state.marginLeft}mm;
        @bottom-center {
          content: ${state.showPageNumbers ? '"Pagina " counter(page) " van " counter(pages)' : 'none'};
          font-family: system-ui, sans-serif;
          font-size: 11px;
          color: #475569;
        }
      }

      .pp-preview-root,
      .pagedjs_pages {
        --pp-font-scale: ${fs};
        --pp-line-height: ${lh};
        --pp-spacing-scale: ${sp};
        --pp-image-scale: ${img};
        color: inherit;
      }

      .pp-preview-root,
      .pagedjs_pages,
      .pp-preview-root p,
      .pagedjs_pages p,
      .pp-preview-root li,
      .pagedjs_pages li,
      .pp-preview-root td,
      .pagedjs_pages td,
      .pp-preview-root blockquote,
      .pagedjs_pages blockquote,
      .pp-preview-root figcaption,
      .pagedjs_pages figcaption,
      .pp-preview-root .story-chunk,
      .pagedjs_pages .story-chunk {
        line-height: var(--pp-line-height);
      }

      .pp-preview-root .masthead-text h1,
      .pagedjs_pages .masthead-text h1 {
        font-size: calc(28px * var(--pp-font-scale));
      }

      .pp-preview-root .masthead-text p,
      .pagedjs_pages .masthead-text p,
      .pp-preview-root .tagline,
      .pagedjs_pages .tagline,
      .pp-preview-root .classic-speaker,
      .pagedjs_pages .classic-speaker,
      .pp-preview-root .img-placeholder-text small,
      .pagedjs_pages .img-placeholder-text small,
      .pp-preview-root .gen-z-meta,
      .pagedjs_pages .gen-z-meta,
      .pp-preview-root figcaption,
      .pagedjs_pages figcaption {
        font-size: calc(14px * var(--pp-font-scale));
      }

      .pp-preview-root h2.section-title,
      .pagedjs_pages h2.section-title {
        font-size: calc(26px * var(--pp-font-scale));
        margin-top: calc(16px * var(--pp-spacing-scale));
        margin-bottom: calc(16px * var(--pp-spacing-scale));
      }

      .pp-preview-root .lore-panel p,
      .pagedjs_pages .lore-panel p,
      .pp-preview-root .classic-dialogue p,
      .pagedjs_pages .classic-dialogue p,
      .pp-preview-root .gen-z-dialogue p,
      .pagedjs_pages .gen-z-dialogue p,
      .pp-preview-root .gen-z-intro,
      .pagedjs_pages .gen-z-intro,
      .pp-preview-root .final-oath-box p,
      .pagedjs_pages .final-oath-box p,
      .pp-preview-root p,
      .pagedjs_pages p,
      .pp-preview-root li,
      .pagedjs_pages li,
      .pp-preview-root td,
      .pagedjs_pages td {
        font-size: calc(17.5px * var(--pp-font-scale));
      }

      .pp-preview-root .epic-oath p,
      .pagedjs_pages .epic-oath p {
        font-size: calc(19px * var(--pp-font-scale));
      }

      .pp-preview-root .drop-cap::first-letter,
      .pagedjs_pages .drop-cap::first-letter {
        font-size: calc(3.5rem * var(--pp-font-scale));
      }

      .pp-preview-root .gen-z-title,
      .pagedjs_pages .gen-z-title {
        font-size: calc(3rem * var(--pp-font-scale));
      }

      .pp-preview-root .hero-image,
      .pagedjs_pages .hero-image,
      .pp-preview-root .square-image,
      .pagedjs_pages .square-image {
        transform: scale(var(--pp-image-scale));
        transform-origin: top center;
        margin-bottom: calc(12px * var(--pp-spacing-scale) * var(--pp-image-scale));
      }
      .pp-preview-root .hero-image img,
      .pagedjs_pages .hero-image img,
      .pp-preview-root .square-image img,
      .pagedjs_pages .square-image img {
        position: relative;
      }

      .pp-preview-root .story-chunk,
      .pagedjs_pages .story-chunk {
        margin-top: calc(12px * var(--pp-spacing-scale));
        margin-bottom: calc(12px * var(--pp-spacing-scale));
      }

      .pp-preview-root header.masthead,
      .pagedjs_pages header.masthead {
        margin-bottom: calc(24px * var(--pp-spacing-scale));
        padding-bottom: calc(12px * var(--pp-spacing-scale));
      }

      .pp-preview-root .lore-panel,
      .pagedjs_pages .lore-panel,
      .pp-preview-root .classic-dialogue,
      .pagedjs_pages .classic-dialogue,
      .pp-preview-root .gen-z-dialogue,
      .pagedjs_pages .gen-z-dialogue,
      .pp-preview-root .epic-oath,
      .pagedjs_pages .epic-oath,
      .pp-preview-root .final-oath-box,
      .pagedjs_pages .final-oath-box {
        margin-top: calc(12px * var(--pp-spacing-scale));
        margin-bottom: calc(12px * var(--pp-spacing-scale));
      }

      /* keep chunks together by default */
      .pp-preview-root .story-chunk,
      .pagedjs_pages .story-chunk {
        break-inside: avoid;
      }

      /* gen-z-section: neutralise flex height so content flows */
      .pp-preview-root .gen-z-section,
      .pagedjs_pages .gen-z-section {
        height: auto;
        display: block;
      }

      /* card wrapper: remove constraints */
      .pp-preview-root .card,
      .pagedjs_pages .card {
        box-shadow: none;
        border-radius: 0;
        padding: 0;
      }

      .pp-preview-root .print-page,
      .pagedjs_pages .print-page {
        min-height: auto;
        box-shadow: none;
        margin-bottom: 0;
        border: 0;
        border-radius: 0;
        padding: 0;
      }
    ` + buildChunkBreakCSS();
  }

  // Chunk force-breaks MUST be emitted as a real stylesheet rule, not as an
  // inline style: this Paged.js only honours break-before when its preprocessor
  // finds it in a stylesheet (it rewrites such rules into the data-break-before
  // attributes the layout reads — inline styles are ignored for breaks). This is
  // what makes the sidebar "Break before" dropdown, the in-preview "Start page
  // here" button, and the draggable break markers actually move content.
  function buildChunkBreakCSS() {
    const rules = [];
    Object.keys(state.chunkBreaks).forEach(id => {
      const r = state.chunkBreaks[id];
      if (!r || !r.breakBefore) return;
      const safeId = id.replace(/["\\]/g, '\\$&');
      rules.push(`.story-chunk[data-chunk-id="${safeId}"]{break-before:${r.breakBefore};}`);
    });
    return rules.length ? '\n' + rules.join('\n') : '';
  }

  /* ========== collect existing stylesheets as CSS text ========== */
  function collectDocStyles() {
    const parts = [];
    qsa('style').forEach(st => {
      // skip Paged.js injected styles and our preview CSS
      if (st.dataset.pagedjs || st.id === 'pp-tweak-style') return;
      parts.push(st.textContent);
    });
    return parts.join('\n');
  }

  /* ========== create blob URL from CSS text ========== */
  let activeBlobUrls = [];
  function cssBlobUrl(cssText) {
    const blob = new Blob([cssText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    activeBlobUrls.push(url);
    return url;
  }
  function revokeBlobs() {
    activeBlobUrls.forEach(u => URL.revokeObjectURL(u));
    activeBlobUrls = [];
  }

  /* ========== per-page tweaks ========== */
  // These let a single rendered page be nudged independently of the global
  // sliders — e.g. to grow content into the slack a forced break left at the
  // bottom of a page. They are applied as pure CSS overrides on the
  // already-rendered DOM (no Paged.js re-run), so they're instant. They are
  // wiped on every re-pagination (see renderPages) because page boundaries
  // move and "page 3" is no longer the same content.

  const PAGE_TWEAK_KEYS = [
    'fontScale', 'lineHeight', 'spacing',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  ];

  function getPageTweak(pageNumber) {
    const key = String(pageNumber);
    if (!state.pageTweaks[key]) {
      state.pageTweaks[key] = { ...PAGE_TWEAK_DEFAULTS };
    }
    return state.pageTweaks[key];
  }

  function pageTweakIsDefault(tweak) {
    return PAGE_TWEAK_KEYS.every(k => tweak[k] === PAGE_TWEAK_DEFAULTS[k]);
  }

  function setPageTweak(pageNumber, key, value) {
    const tweak = getPageTweak(pageNumber);
    tweak[key] = value;
    // Drop the entry entirely if it's back to neutral, so the page un-marks.
    if (pageTweakIsDefault(tweak)) {
      delete state.pageTweaks[String(pageNumber)];
    }
    applyPageTweaks();
  }

  function resetPageTweak(pageNumber) {
    delete state.pageTweaks[String(pageNumber)];
    applyPageTweaks();
  }

  // (Re)build the single injected stylesheet that carries every per-page
  // override. Font/line-height/spacing reuse the engine's own --pp-* variables
  // (so the existing calc()-based sizing rules pick them up); margins reuse
  // Paged.js's own --pagedjs-margin-* variables on the pagebox grid.
  function applyPageTweaks() {
    let styleEl = document.getElementById('pp-perpage-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'pp-perpage-style';
      document.head.appendChild(styleEl);
    }

    const rules = [];
    Object.keys(state.pageTweaks).forEach(pageNum => {
      const t = state.pageTweaks[pageNum];
      if (!t) return;
      const sel = `.pp-overlay .pagedjs_page[data-page-number="${pageNum}"]`;

      // Font/line-height/spacing reuse the engine's --pp-* variables. buildPagedCSS
      // sets those on `.pp-preview-root, .pagedjs_pages`, so a per-page override
      // must sit at the right place in the cascade for EACH content structure:
      //  - Delphi-style content nests inside .pp-preview-root (which re-declares
      //    the vars), so we must override .pp-preview-root itself.
      //  - Hannibal-style content is NOT a descendant of .pp-preview-root after
      //    Paged.js fragments it, so there we override .pagedjs_page_content
      //    (always an ancestor of the page's content, with no re-declaration
      //    between it and the text).
      // Setting both is harmless where one doesn't apply, and covers both layouts.
      const fontDecls = [];
      if (t.fontScale != null)  fontDecls.push(`--pp-font-scale:${t.fontScale / 100};`);
      if (t.lineHeight != null) fontDecls.push(`--pp-line-height:${t.lineHeight / 100};`);
      if (t.spacing != null)    fontDecls.push(`--pp-spacing-scale:${t.spacing / 100};`);
      if (fontDecls.length) {
        rules.push(`${sel} .pagedjs_page_content,${sel} .pp-preview-root{${fontDecls.join('')}}`);
      }

      // Margins reuse Paged.js's own --pagedjs-margin-* variables, consumed by
      // the pagebox grid. !important beats Paged.js's per-page margin values.
      const marginDecls = [];
      if (t.marginTop != null)    marginDecls.push(`--pagedjs-margin-top:${t.marginTop}mm !important;`);
      if (t.marginRight != null)  marginDecls.push(`--pagedjs-margin-right:${t.marginRight}mm !important;`);
      if (t.marginBottom != null) marginDecls.push(`--pagedjs-margin-bottom:${t.marginBottom}mm !important;`);
      if (t.marginLeft != null)   marginDecls.push(`--pagedjs-margin-left:${t.marginLeft}mm !important;`);
      if (marginDecls.length) {
        rules.push(`${sel} .pagedjs_pagebox{${marginDecls.join('')}}`);
      }
    });
    styleEl.textContent = rules.join('\n');

    // Reflect tweaked state on each page so the user can see which pages carry
    // an override.
    const previewArea = qs('#ppPreviewArea');
    if (previewArea) {
      qsa('.pagedjs_page', previewArea).forEach(page => {
        const tweaked = Boolean(state.pageTweaks[page.dataset.pageNumber]);
        page.classList.toggle('pp-page-tweaked', tweaked);
      });
    }
  }

  function clearPageTweaks() {
    const hadTweaks = Object.keys(state.pageTweaks).length > 0;
    state.pageTweaks = {};
    const styleEl = document.getElementById('pp-perpage-style');
    if (styleEl) styleEl.textContent = '';
    return hadTweaks;
  }

  let statusNoticeTimer = null;
  function showStatusNotice(message) {
    const statusBar = qs('.pp-status');
    if (!statusBar) return;
    let notice = qs('#ppNotice', statusBar);
    if (!notice) {
      notice = document.createElement('span');
      notice.id = 'ppNotice';
      notice.className = 'pp-status-notice';
      statusBar.appendChild(notice);
    }
    notice.textContent = message;
    notice.classList.add('pp-status-notice-show');
    if (statusNoticeTimer) clearTimeout(statusNoticeTimer);
    statusNoticeTimer = setTimeout(() => {
      notice.classList.remove('pp-status-notice-show');
    }, 4000);
  }

  /* ========== render pages ========== */
  let currentPreviewer = null;

  async function renderPages(previewArea) {
    if (state.rendering) return;
    state.rendering = true;

    // Re-pagination invalidates every per-page tweak (page boundaries move), so
    // clear them and remember whether we need to tell the user.
    state.pageTweaksClearedNotice = clearPageTweaks();

    // show spinner
    previewArea.innerHTML = '<div class="pp-loading"><div class="pp-spinner"></div>Rendering pages&hellip;</div>';

    try {
      // clean up previous render
      revokeBlobs();
      currentPreviewer = null;
      // remove any Paged.js injected style tags from previous render
      qsa('style[data-pagedjs-inserted-styles]').forEach(s => s.remove());

      // prepare content as a document fragment
      const content = prepareContent();

      previewArea.innerHTML = '';

      // build stylesheets as blob URLs (Paged.js expects URL strings)
      const docCSS = collectDocStyles();
      const tweakCSS = buildPagedCSS();
      const stylesheets = [
        cssBlobUrl(docCSS),
        cssBlobUrl(tweakCSS),
      ];

      const paged = new window.Paged.Previewer();
      currentPreviewer = paged;

      const flow = await paged.preview(
        content,
        stylesheets,
        previewArea
      );

      decoratePreview(previewArea);
      populateChunkList();

      // update status bar
      const pageCount = flow && flow.total ? flow.total : qsa('.pagedjs_page', previewArea).length;
      state.renderedPageCount = pageCount;
      const countEl = qs('#ppPageCount');
      if (countEl) countEl.textContent = pageCount + ' page' + (pageCount !== 1 ? 's' : '');

      const dim = PAGE_DIMS[state.pageSize];
      const dimEl = qs('#ppDims');
      if (dimEl) dimEl.textContent = dim.width + ' \u00d7 ' + dim.height;

      // If this re-pagination wiped per-page tweaks, let the user know.
      if (state.pageTweaksClearedNotice) {
        showStatusNotice('Per-page tweaks were reset because the pages were re-laid-out.');
        state.pageTweaksClearedNotice = false;
      }

    } catch (err) {
      console.error('Print preview render error', err);
      previewArea.innerHTML =
        '<div class="pp-loading" style="color:#ef4444">Render failed — see console for details.</div>';
    } finally {
      state.rendering = false;
    }
  }

  /* ========== populate chunk list ========== */
  function populateChunkList() {
    const list = qs('#ppChunkList');
    if (!list) return;

    const root = qs('#document-root') || qs('.page-wrapper .card') || qs('.page-wrapper');
    if (!root) return;

    const chunks = qsa('.story-chunk[data-chunk-id]', root);
    if (chunks.length === 0) {
      list.innerHTML = '<em style="font-size:11px;color:#94a3b8">No addressable chunks found.</em>';
      return;
    }

    list.innerHTML = '';
    chunks.forEach(ch => {
      const id = ch.dataset.chunkId;
      const label = id.replace(/-/g, ' ');
      const rules = state.chunkBreaks[id] || {};
      const breakBefore = rules.breakBefore || '';
      const div = document.createElement('div');
      div.className = 'pp-chunk-item';
      const options = BREAK_BEFORE_OPTIONS.map(option => {
        const selected = option.value === breakBefore ? 'selected' : '';
        return `<option value="${option.value}" ${selected}>${option.label}</option>`;
      }).join('');
      const keepTogether = rules.keepTogether ? 'checked' : '';
      div.innerHTML = `
        <div class="pp-chunk-item-title" title="Chunk: ${id}">${label}</div>
        <label class="pp-chunk-setting-row">
          <span>Break before</span>
          <select class="pp-chunk-break-select" data-chunk="${id}" data-setting="breakBefore">${options}</select>
        </label>
        <label class="pp-chunk-setting-row pp-checkbox-row">
          <input type="checkbox" data-chunk="${id}" data-setting="keepTogether" ${keepTogether}>
          <span>Keep this block together</span>
        </label>`;
      list.appendChild(div);
    });
  }

  function normalizeChunkRules(chunkId) {
    if (!chunkId) return;

    if (!state.chunkBreaks[chunkId]) {
      state.chunkBreaks[chunkId] = { breakBefore: '', keepTogether: false };
    }

    return state.chunkBreaks[chunkId];
  }

  function setChunkBreak(chunkId, breakBefore) {
    if (!chunkId) return;

    if (!breakBefore) {
      if (state.chunkBreaks[chunkId]?.keepTogether) {
        state.chunkBreaks[chunkId].breakBefore = '';
      } else {
        delete state.chunkBreaks[chunkId];
      }
      return;
    }

    const rules = normalizeChunkRules(chunkId);
    rules.breakBefore = breakBefore;
  }

  function setChunkKeepTogether(chunkId, keepTogether) {
    if (!chunkId) return;

    if (!keepTogether && !state.chunkBreaks[chunkId]?.breakBefore) {
      delete state.chunkBreaks[chunkId];
      return;
    }

    const rules = normalizeChunkRules(chunkId);
    rules.keepTogether = Boolean(keepTogether);
  }

  function moveChunkBreak(fromChunkId, toChunkId) {
    if (!fromChunkId || !toChunkId || fromChunkId === toChunkId) return;
    const breakBefore = state.chunkBreaks[fromChunkId]?.breakBefore;
    if (!breakBefore) return;
    setChunkBreak(fromChunkId, '');
    setChunkBreak(toChunkId, breakBefore);
  }

  function getBreakModeLabel(value) {
    const match = BREAK_BEFORE_OPTIONS.find(option => option.value === value);
    return match ? match.label : 'Start on next page';
  }

  function decoratePreview(previewArea) {
    if (!previewArea) return;

    qsa('.pagedjs_page', previewArea).forEach((page, index) => {
      page.dataset.pageNumber = String(index + 1);
    });

    qsa('.story-chunk[data-chunk-id]', previewArea).forEach(chunk => {
      const chunkId = chunk.dataset.chunkId;
      if (!chunkId) return;

      chunk.classList.add('pp-preview-chunk');
      chunk.dataset.chunkLabel = chunkId.replace(/-/g, ' ');

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'pp-chunk-break-toggle';
      toggle.dataset.chunkId = chunkId;
      toggle.textContent = state.chunkBreaks[chunkId]?.breakBefore
        ? 'Clear break rule'
        : 'Start page here';
      chunk.appendChild(toggle);

      if (state.chunkBreaks[chunkId]?.breakBefore) {
        chunk.classList.add('pp-break-before');

        const marker = document.createElement('div');
        marker.className = 'pp-break-marker';
        marker.draggable = true;
        marker.dataset.chunkId = chunkId;
        marker.innerHTML = `<span class="pp-break-marker-label">${getBreakModeLabel(state.chunkBreaks[chunkId].breakBefore)}</span><span class="pp-break-marker-hint">Drag to move</span>`;
        chunk.appendChild(marker);
      }

      if (state.chunkBreaks[chunkId]?.keepTogether) {
        chunk.classList.add('pp-keep-together');
      }
    });

    // Add a per-page "Tweak page" control to every rendered page.
    qsa('.pagedjs_page', previewArea).forEach(addPageTweakControls);
  }

  function pageTweakRow(pageNumber, key, label, min, max, step, value, display) {
    return `
      <label class="pp-page-tweak-row">
        <span class="pp-page-tweak-label">${label}</span>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${value}"
               data-page-tweak="${key}" data-page-number="${pageNumber}">
        <span class="pp-page-tweak-val" data-page-tweak-val="${key}">${display(value)}</span>
      </label>`;
  }

  const PAGE_TWEAK_FMT = {
    pct: v => v + '%',
    lh: v => (v / 100).toFixed(2),
    mm: v => v + 'mm',
  };

  function addPageTweakControls(page) {
    const pageNumber = page.dataset.pageNumber;
    if (!pageNumber) return;
    if (qs('.pp-page-tweak-btn', page)) return; // already decorated this render

    const t = state.pageTweaks[pageNumber] || PAGE_TWEAK_DEFAULTS;
    const { pct, lh, mm } = PAGE_TWEAK_FMT;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pp-page-tweak-btn';
    btn.dataset.pageNumber = pageNumber;
    btn.innerHTML = '&#9881; Tweak page ' + pageNumber;
    page.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'pp-page-tweak-panel';
    panel.dataset.pageNumber = pageNumber;
    panel.innerHTML = `
      <div class="pp-page-tweak-head">Page ${pageNumber} only</div>
      <p class="pp-page-tweak-hint">Grow this page's content to fill a bottom gap, or nudge its margins. These reset if the pages get re-laid-out.</p>
      ${pageTweakRow(pageNumber, 'fontScale', 'Font', 70, 140, 1, t.fontScale, pct)}
      ${pageTweakRow(pageNumber, 'lineHeight', 'Line height', 100, 220, 5, t.lineHeight, lh)}
      ${pageTweakRow(pageNumber, 'spacing', 'Spacing', 40, 180, 5, t.spacing, pct)}
      ${pageTweakRow(pageNumber, 'marginTop', 'Margin top', 0, 40, 1, t.marginTop, mm)}
      ${pageTweakRow(pageNumber, 'marginRight', 'Margin right', 0, 40, 1, t.marginRight, mm)}
      ${pageTweakRow(pageNumber, 'marginBottom', 'Margin bottom', 0, 40, 1, t.marginBottom, mm)}
      ${pageTweakRow(pageNumber, 'marginLeft', 'Margin left', 0, 40, 1, t.marginLeft, mm)}
      <div class="pp-page-tweak-actions">
        <button type="button" class="pp-page-tweak-reset" data-page-number="${pageNumber}">Reset this page</button>
        <button type="button" class="pp-page-tweak-close">Close</button>
      </div>`;
    page.appendChild(panel);
  }

  function pageTweakDisplay(key, value) {
    if (key === 'lineHeight') return PAGE_TWEAK_FMT.lh(value);
    if (key.startsWith('margin')) return PAGE_TWEAK_FMT.mm(value);
    return PAGE_TWEAK_FMT.pct(value);
  }

  /* ========== enter / exit ========== */
  let overlay = null;

  async function enterPreview() {
    if (state.active) return;
    state.active = true;
    document.body.classList.add('pp-active');

    // hide original content
    const orig = qs('.page-wrapper');
    if (orig) orig.style.display = 'none';

    // build & attach overlay
    overlay = buildOverlay();
    document.body.appendChild(overlay);

    // populate chunk list
    populateChunkList();

    // wire events
    wireEvents();

    // load Paged.js then render
    await loadPagedJS();
    registerPreviewHandler();
    await renderPages(qs('#ppPreviewArea'));
  }

  function exitPreview() {
    if (!state.active) return;
    state.active = false;
    document.body.classList.remove('pp-active');

    // remove overlay
    if (overlay) { overlay.remove(); overlay = null; }

    // show original content
    const orig = qs('.page-wrapper');
    if (orig) orig.style.display = '';

    // clean up Paged.js artefacts
    revokeBlobs();
    qsa('style[data-pagedjs-inserted-styles]').forEach(s => s.remove());

    // clean up per-page tweak overrides so a fresh enter starts neutral
    clearPageTweaks();
    const perPageStyle = document.getElementById('pp-perpage-style');
    if (perPageStyle) perPageStyle.remove();
  }

  function doPrint() {
    window.print();
  }

  /* ========== event wiring ========== */
  function wireEvents() {
    if (!overlay) return;

    // toolbar buttons
    qs('.pp-btn-print', overlay).addEventListener('click', doPrint);
    qs('.pp-btn-exit', overlay).addEventListener('click', exitPreview);

    // mobile sidebar toggle
    const toggleBtn = qs('.pp-btn-toggle-sidebar', overlay);
    const sidebar = qs('.pp-sidebar', overlay);
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => sidebar.classList.toggle('pp-sidebar-open'));
    }

    // range sliders
    qsa('input[type="range"][data-tweak]', overlay).forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.tweak;
        const value = Number(input.value);

        if (key === 'marginAll') {
          state.marginAll = value;
          state.marginTop = value;
          state.marginRight = value;
          state.marginBottom = value;
          state.marginLeft = value;

          qsa('input[data-margin-side]', overlay).forEach(slider => {
            slider.value = String(value);
            const sideVal = qs(`.pp-val[data-for="${slider.dataset.tweak}"]`, overlay);
            if (sideVal) sideVal.textContent = value + 'mm';
          });
        } else {
          state[key] = value;
          if (input.dataset.marginSide) {
            const sides = [state.marginTop, state.marginRight, state.marginBottom, state.marginLeft];
            const allSame = sides.every(side => side === sides[0]);
            state.marginAll = allSame ? sides[0] : Math.round((sides[0] + sides[1] + sides[2] + sides[3]) / 4);
            const allSlider = qs('input[data-tweak="marginAll"]', overlay);
            if (allSlider) allSlider.value = String(state.marginAll);
            const allVal = qs('.pp-val[data-for="marginAll"]', overlay);
            if (allVal) allVal.textContent = state.marginAll + 'mm';
          }
        }

        // update displayed value
        const valSpan = qs(`.pp-val[data-for="${key}"]`, overlay);
        if (valSpan) {
          if (key === 'lineHeight') {
            valSpan.textContent = (state[key] / 100).toFixed(1);
          } else if (key.startsWith('margin')) {
            valSpan.textContent = state[key] + 'mm';
          } else {
            valSpan.textContent = state[key] + '%';
          }
        }
      });

      // re-render on change (mouseup / touchend) to avoid hammering
      input.addEventListener('change', () => {
        renderPages(qs('#ppPreviewArea'));
      });
    });

    qsa('input[type="checkbox"][data-tweak]', overlay).forEach(input => {
      input.addEventListener('change', () => {
        state[input.dataset.tweak] = input.checked;
        renderPages(qs('#ppPreviewArea'));
      });
    });

    // page size select
    const sel = qs('select[data-tweak="pageSize"]', overlay);
    if (sel) {
      sel.addEventListener('change', () => {
        state.pageSize = sel.value;
        renderPages(qs('#ppPreviewArea'));
      });
    }

    // chunk break-before checkboxes (delegated)
    const chunkList = qs('#ppChunkList', overlay);
    if (chunkList) {
      chunkList.addEventListener('change', (e) => {
        const id = e.target.dataset.chunk;
        if (!id) return;
        if (e.target.dataset.setting === 'breakBefore') {
          setChunkBreak(id, e.target.value);
        }
        if (e.target.dataset.setting === 'keepTogether') {
          setChunkKeepTogether(id, e.target.checked);
        }
        renderPages(qs('#ppPreviewArea'));
      });
    }

    const previewArea = qs('#ppPreviewArea', overlay);
    if (previewArea) {
      previewArea.addEventListener('click', (e) => {
        const toggle = e.target.closest('.pp-chunk-break-toggle');
        if (!toggle) return;

        const chunkId = toggle.dataset.chunkId;
        if (!chunkId) return;

        const nextValue = state.chunkBreaks[chunkId]?.breakBefore ? '' : 'page';
        setChunkBreak(chunkId, nextValue);
        renderPages(previewArea);
      });

      // per-page tweak controls (delegated; instant, no re-pagination)
      previewArea.addEventListener('click', (e) => {
        const openBtn = e.target.closest('.pp-page-tweak-btn');
        if (openBtn) {
          const page = openBtn.closest('.pagedjs_page');
          const panel = page && qs('.pp-page-tweak-panel', page);
          const willOpen = panel && !panel.classList.contains('pp-page-tweak-open');
          // only one panel open at a time
          qsa('.pp-page-tweak-panel.pp-page-tweak-open', previewArea)
            .forEach(p => p.classList.remove('pp-page-tweak-open'));
          qsa('.pp-page-tweak-btn.pp-active', previewArea)
            .forEach(b => b.classList.remove('pp-active'));
          if (panel && willOpen) {
            panel.classList.add('pp-page-tweak-open');
            openBtn.classList.add('pp-active');
          }
          return;
        }

        const closeBtn = e.target.closest('.pp-page-tweak-close');
        if (closeBtn) {
          const panel = closeBtn.closest('.pp-page-tweak-panel');
          const page = closeBtn.closest('.pagedjs_page');
          if (panel) panel.classList.remove('pp-page-tweak-open');
          const btn = page && qs('.pp-page-tweak-btn', page);
          if (btn) btn.classList.remove('pp-active');
          return;
        }

        const resetBtn = e.target.closest('.pp-page-tweak-reset');
        if (resetBtn) {
          const pageNumber = resetBtn.dataset.pageNumber;
          resetPageTweak(pageNumber);
          const panel = resetBtn.closest('.pp-page-tweak-panel');
          if (panel) {
            qsa('input[data-page-tweak]', panel).forEach(input => {
              const key = input.dataset.pageTweak;
              input.value = String(PAGE_TWEAK_DEFAULTS[key]);
              const val = qs(`[data-page-tweak-val="${key}"]`, panel);
              if (val) val.textContent = pageTweakDisplay(key, PAGE_TWEAK_DEFAULTS[key]);
            });
          }
          return;
        }
      });

      previewArea.addEventListener('input', (e) => {
        const input = e.target.closest('input[data-page-tweak]');
        if (!input) return;
        const pageNumber = input.dataset.pageNumber;
        const key = input.dataset.pageTweak;
        const value = Number(input.value);
        setPageTweak(pageNumber, key, value);
        const panel = input.closest('.pp-page-tweak-panel');
        const val = panel && qs(`[data-page-tweak-val="${key}"]`, panel);
        if (val) val.textContent = pageTweakDisplay(key, value);
      });

      previewArea.addEventListener('dragstart', (e) => {
        const marker = e.target.closest('.pp-break-marker');
        if (!marker) return;

        state.draggedBreakChunkId = marker.dataset.chunkId || null;
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', state.draggedBreakChunkId || '');
        }
      });

      previewArea.addEventListener('dragend', () => {
        state.draggedBreakChunkId = null;
        qsa('.pp-break-drop-target', previewArea).forEach(chunk => {
          chunk.classList.remove('pp-break-drop-target');
        });
      });

      previewArea.addEventListener('dragover', (e) => {
        const chunk = e.target.closest('.story-chunk[data-chunk-id]');
        if (!chunk || !state.draggedBreakChunkId) return;

        e.preventDefault();
        if (chunk.dataset.chunkId !== state.draggedBreakChunkId) {
          chunk.classList.add('pp-break-drop-target');
        }
      });

      previewArea.addEventListener('dragleave', (e) => {
        const chunk = e.target.closest('.story-chunk[data-chunk-id]');
        if (!chunk) return;
        chunk.classList.remove('pp-break-drop-target');
      });

      previewArea.addEventListener('drop', (e) => {
        const chunk = e.target.closest('.story-chunk[data-chunk-id]');
        if (!chunk || !state.draggedBreakChunkId) return;

        e.preventDefault();
        chunk.classList.remove('pp-break-drop-target');

        const targetChunkId = chunk.dataset.chunkId;
        moveChunkBreak(state.draggedBreakChunkId, targetChunkId);
        state.draggedBreakChunkId = null;
        renderPages(previewArea);
      });
    }

    // reset
    qs('#ppReset', overlay).addEventListener('click', () => {
      state.fontSize = 100;
      state.lineHeight = 150;
      state.imageScale = 100;
      state.spacing = 100;
      state.marginAll = 15;
      state.marginTop = 15;
      state.marginRight = 15;
      state.marginBottom = 15;
      state.marginLeft = 15;
      state.pageSize = 'A4P';
      state.showPageNumbers = false;
      state.chunkBreaks = {};
      state.draggedBreakChunkId = null;
      state.renderedPageCount = 0;

      // sync UI
      qsa('input[type="range"][data-tweak]', overlay).forEach(inp => {
        inp.value = state[inp.dataset.tweak];
        inp.dispatchEvent(new Event('input'));
      });
      qsa('input[type="checkbox"][data-tweak]', overlay).forEach(inp => {
        inp.checked = Boolean(state[inp.dataset.tweak]);
      });
      const selEl = qs('select[data-tweak="pageSize"]', overlay);
      if (selEl) selEl.value = state.pageSize;

      renderPages(qs('#ppPreviewArea'));
    });

    // ESC key
    document.addEventListener('keydown', onEsc);
  }

  function onEsc(e) {
    if (e.key === 'Escape' && state.active) {
      exitPreview();
      document.removeEventListener('keydown', onEsc);
    }
  }

  /* ========== create trigger button ========== */
  function createTrigger() {
    const btn = document.createElement('button');
    btn.className = 'pp-trigger';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg> Print Preview`;
    btn.addEventListener('click', enterPreview);
    document.body.appendChild(btn);
  }

  /* ========== init ========== */
  function init() {
    // only init if there's content to preview
    if (!qs('#document-root') && !qs('.page-wrapper')) return;
    createTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
