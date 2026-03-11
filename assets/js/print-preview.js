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

    // apply per-chunk break overrides
    qsa('.story-chunk', clone).forEach(ch => {
      const id = ch.dataset.chunkId;
      const chunkRules = id ? state.chunkBreaks[id] : null;
      if (chunkRules?.breakBefore) {
        ch.style.setProperty('break-before', chunkRules.breakBefore);
        if (chunkRules.breakBefore === 'page') {
          ch.style.setProperty('page-break-before', 'always');
        } else if (chunkRules.breakBefore === 'left' || chunkRules.breakBefore === 'right') {
          ch.style.setProperty('page-break-before', chunkRules.breakBefore);
        }
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
    `;
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

  /* ========== render pages ========== */
  let currentPreviewer = null;

  async function renderPages(previewArea) {
    if (state.rendering) return;
    state.rendering = true;

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
