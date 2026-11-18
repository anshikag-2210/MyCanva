# MyCanvas Studio

A dependency-free, browser-runnable **design editor** — a Canva-*style* tool you can open with a double-click. It implements the common feature set of a modern graphic-design web app (template gallery, drag-and-drop artboard, text/shapes/images, brand kit, layers, multi-page documents, and PNG/SVG/PDF/JSON export) in **entirely original** code, UI, and template content.

> **Provenance note.** This project does **not** copy, decompile, or reverse-engineer Canva's proprietary source, website markup, brand assets, fonts, stock photos, or template content. "Canva-style" refers only to the *category* of features a design editor offers. Every line of code, the UI layout, the product name, and all sample templates here are authored from scratch. It is not affiliated with or endorsed by Canva.

## Run it

No build step, no dependencies. Either:

- **Double-click `index.html`** in a modern browser (Chrome/Edge/Firefox), or
- Serve the folder: `npx serve .` / `python -m http.server` and open `http://localhost:…`.

Everything (projects, uploads, brand kit) persists to **localStorage** in your browser.

## Features

- **Dashboard** — your saved designs (with thumbnails), an importable design list, and a searchable template gallery.
- **Templates** — 11 original templates: quote post, story, pitch deck (5 pages), YouTube thumbnail, resume, event poster, business card (2 pages), café menu, web banner, invitation, blank.
- **Artboard** — SVG-based canvas. Select, drag (with snap guides + alignment to page/other elements), resize (8 handles, aspect-locked with Shift), rotate (15° steps, free with Shift), zoom (fit / ± / Ctrl+scroll), nudge (arrows, Shift = 10px).
- **Elements** — 10 shapes (rect, rounded, circle, triangle, star, heart, diamond, arrow, ring, line) + 6 original generated graphics (dot grid, rings, zigzag, wave, burst, confetti).
- **Text** — 5 style presets, 10 system fonts, size/weight/italic/underline, letter-spacing, line-height, alignment, color, in-place editing (double-click).
- **Uploads** — drop in your own images (auto-downscaled to fit localStorage); reuse across a design.
- **Background** — solid, gradient (angle control), or image.
- **Brand kit** — 8 brand colors + 2 brand fonts; brand colors surface as quick swatches in every fill control.
- **Layers** — reorder, show/hide, jump-to-selection.
- **Pages** — multi-page documents with a thumbnail strip; add/duplicate/delete pages; apply a template as new pages.
- **History** — undo/redo (Ctrl+Z / Ctrl+Shift+Z), 80 steps.
- **Export** — PNG (1×/2×), SVG (vector), multi-page **PDF** (a small hand-written PDF writer embedding JPEG pages — no library), and a portable `.json` design file (re-importable).

## Keyboard

| Key | Action |
| --- | --- |
| `Ctrl/⌘ Z` · `Ctrl/⌘ Shift Z` · `Ctrl/⌘ Y` | Undo / Redo |
| `Ctrl/⌘ D` | Duplicate element |
| `Del` / `Backspace` | Delete element |
| Arrows (`Shift` = 10px) | Nudge |
| `Shift` while resizing | Lock aspect ratio |
| `Shift` while rotating | Free rotation |
| `Ctrl/⌘ Enter` | Commit text edit |
| `Esc` | Deselect / cancel |
| `Ctrl/⌘ Scroll` | Zoom at cursor |

## Architecture

Vanilla ES5-style modules on a single global namespace (`window.MC`). No framework, no build, no network calls.

```
index.html          app shell (dashboard + editor)
css/app.css         all styles
js/utils.js         small helpers (uid, color, wrap, download, image scale)
js/state.js         document model, selection, history, element/page ops
js/elements.js      element factories, shape catalog, path generators
js/templates.js     the 11 original template definitions
js/storage.js       localStorage persistence + JSON import
js/render.js        SVG artboard, selection overlay, layers, page strip
js/export.js        canvas renderer + PNG/SVG/PDF/JSON exporters
js/editor.js        pointer interactions: move/resize/rotate, text edit, zoom
js/ui.js            dashboard, left/right panels, topbar, modals, save
js/main.js          bootstrap
```

The editor renders the artboard as **SVG** (each element is an SVG `<g>`). Export re-renders the same model to a **canvas** (PNG/PDF) or serializes the SVG (vector). Both paths share the shape-path generators in `js/elements.js`, so what you see is what you export.

## Tests

- `node tests/smoke.cjs` — headless checks of the pure logic (path scaler, template build, PDF structure). No browser needed.
- `node tests/browser.mjs` — end-to-end browser test (needs system Edge or Chromium): dashboard → open template → drag/resize/rotate → text edit → exports → save.
- `node tests/shots.mjs` — capture UI screenshots.

## Limits (honest scope)

This is a single-browser, local-only tool. It intentionally does **not** implement Canva's cloud services: no real-time multi-user collaboration, no server-side account/storage, no AI generation, no access to Canva's stock/asset libraries, and no font licensing beyond the system fonts available on the machine. PDF export embeds rasterized pages (high quality at 1×); SVG/PNG are the lossless options.
