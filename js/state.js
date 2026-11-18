/* MyCanvas Studio — document model, history, element/page operations. All original. */
(function () {
  "use strict";
  const U = () => window.MC.U;

  const S = {
    doc: null,          // active document
    sel: null,          // selected element id
    activePage: 0,      // index into doc.pages
    zoom: 1,
    history: { past: [], future: [] },
    uploads: {},        // projectId -> [{id,name,src,w,h}] (session cache)
    listeners: new Set(),
  };

  const emit = (ev) => S.listeners.forEach((fn) => { try { fn(ev); } catch (e) { console.error(e); } });
  S.on = (fn) => { S.listeners.add(fn); return () => S.listeners.delete(fn); };

  /* ---------------- document factory ---------------- */
  const SIZES = [
    { key: "a4", label: "A4 (portrait)", w: 1240, h: 1754 },
    { key: "a4l", label: "A4 (landscape)", w: 1754, h: 1240 },
    { key: "ig", label: "Instagram post", w: 1080, h: 1080 },
    { key: "story", label: "Story / Reel", w: 1080, h: 1920 },
    { key: "yt", label: "YouTube thumbnail", w: 1280, h: 720 },
    { key: "pres", label: "Presentation (16:9)", w: 1920, h: 1080 },
    { key: "card", label: "Business card", w: 1050, h: 600 },
    { key: "poster", label: "Poster", w: 1000, h: 1400 },
    { key: "banner", label: "Web banner", w: 1500, h: 500 },
    { key: "square", label: "Square (1:1)", w: 1000, h: 1000 },
  ];

  const newPage = (w, h, name) => ({
    id: U().uid("pg"), name: name || "Page", w, h,
    bg: { type: "color", color: "#ffffff" },
    elements: [],
  });

  const newDoc = (name, w, h) => ({
    id: U().uid("doc"),
    name: name || "Untitled design",
    createdAt: Date.now(), updatedAt: Date.now(),
    brand: {
      colors: ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#1f2430", "#f8fafc"],
      fonts: ["Segoe UI", "Georgia"],
    },
    pages: [newPage(w || 1240, h || 1754, "Page 1")],
  });

  const defaultBgFor = (w, h) => ({ type: "color", color: "#ffffff", w, h });

  /* ---------------- history ----------------
     Ops: beginOp() BEFORE mutating, commit(ev) AFTER. pushHistory is
     kept for callers that already began an op. */
  const snapshot = () => JSON.stringify(S.doc);
  let preSnap = null;
  S.beginOp = () => { preSnap = snapshot(); };
  S.commit = (ev) => {
    if (preSnap == null) return;
    S.history.past.push(preSnap);
    if (S.history.past.length > 80) S.history.past.shift();
    S.history.future.length = 0;
    preSnap = null;
    emit({ type: "history" });
    if (ev) emit(ev);
  };
  S.pushHistory = (ev) => S.commit(ev);
  S.abortOp = () => { preSnap = null; };
  S.beginTransient = (ev) => emit(ev); // no history entry for live drags
  S.undo = () => {
    const prev = S.history.past.pop();
    if (prev == null) return;
    S.history.future.push(snapshot());
    S.doc = JSON.parse(prev);
    S.sel = null;
    S.activePage = U().clamp(S.activePage, 0, S.doc.pages.length - 1);
    emit({ type: "restored" });
  };
  S.redo = () => {
    const next = S.history.future.pop();
    if (next == null) return;
    S.history.past.push(snapshot());
    S.doc = JSON.parse(next);
    S.sel = null;
    S.activePage = U().clamp(S.activePage, 0, S.doc.pages.length - 1);
    emit({ type: "restored" });
  };
  S.canUndo = () => S.history.past.length > 0;
  S.canRedo = () => S.history.future.length > 0;

  /* ---------------- helpers ---------------- */
  S.page = () => S.doc.pages[S.activePage];
  S.el = (id) => (S.page().elements.find((e) => e.id === id) || null);
  S.selected = () => (S.sel ? S.el(S.sel) : null);

  /* ---------------- element operations ---------------- */
  S.addElements = (els, ev) => {
    S.beginOp();
    const list = Array.isArray(els) ? els : [els];
    for (const e of list) {
      e.id = e.id || U().uid("el");
      e.z = S.page().elements.length;
      S.page().elements.push(e);
    }
    S.sel = list[list.length - 1].id;
    S.pushHistory(ev || { type: "changed" });
  };
  S.removeElement = (id) => {
    S.beginOp();
    const p = S.page();
    p.elements = p.elements.filter((e) => e.id !== id);
    p.elements.forEach((e, i) => (e.z = i));
    if (S.sel === id) S.sel = null;
    S.pushHistory({ type: "changed" });
  };
  S.updateElement = (id, patch, ev) => {
    const e = S.el(id);
    if (!e) return;
    S.beginOp();
    Object.assign(e, patch);
    S.pushHistory(ev || { type: "changed" });
  };
  S.nudgeTransient = (id, dx, dy) => {
    const e = S.el(id);
    if (!e) return;
    e.x += dx; e.y += dy;
    S.beginTransient({ type: "moved" });
  };
  S.duplicateSelected = () => {
    const e = S.selected();
    if (!e) return;
    S.beginOp();
    const c = U().clone(e);
    c.id = U().uid("el");
    c.x += 24; c.y += 24;
    S.page().elements.push(c);
    S.sel = c.id;
    S.pushHistory({ type: "changed" });
  };
  S.bringToFront = (id) => {
    const p = S.page();
    const i = p.elements.findIndex((e) => e.id === id);
    if (i < 0) return;
    S.beginOp();
    const [e] = p.elements.splice(i, 1);
    p.elements.push(e);
    p.elements.forEach((x, j) => (x.z = j));
    S.pushHistory({ type: "changed" });
  };
  S.sendToBack = (id) => {
    const p = S.page();
    const i = p.elements.findIndex((e) => e.id === id);
    if (i < 0) return;
    S.beginOp();
    const [e] = p.elements.splice(i, 1);
    p.elements.unshift(e);
    p.elements.forEach((x, j) => (x.z = j));
    S.pushHistory({ type: "changed" });
  };

  /* ---------------- page operations ---------------- */
  S.setActivePage = (i) => {
    S.activePage = U().clamp(i, 0, S.doc.pages.length - 1);
    S.sel = null;
    emit({ type: "page" });
  };
  S.addPage = (opts) => {
    S.beginOp();
    const src = S.page();
    const p = newPage((opts && opts.w) || src.w, (opts && opts.h) || src.h, "Page " + (S.doc.pages.length + 1));
    S.doc.pages.push(p);
    S.activePage = S.doc.pages.length - 1;
    S.sel = null;
    S.pushHistory({ type: "pages" });
  };
  S.removePage = (i) => {
    if (S.doc.pages.length <= 1) return;
    S.beginOp();
    S.doc.pages.splice(i, 1);
    if (S.activePage >= S.doc.pages.length) S.activePage = S.doc.pages.length - 1;
    S.sel = null;
    S.pushHistory({ type: "pages" });
  };
  S.duplicatePage = (i) => {
    S.beginOp();
    const c = U().clone(S.doc.pages[i]);
    c.id = U().uid("pg");
    c.name = c.name + " copy";
    c.elements.forEach((e) => (e.id = U().uid("el")));
    S.doc.pages.splice(i + 1, 0, c);
    S.activePage = i + 1;
    S.pushHistory({ type: "pages" });
  };

  /* ---------------- document lifecycle ---------------- */
  S.openDoc = (doc) => {
    S.doc = doc;
    S.sel = null;
    S.activePage = 0;
    S.history = { past: [], future: [] };
    emit({ type: "opened" });
  };

  S.SIZES = SIZES;
  S.defaultBgFor = defaultBgFor;
  S.newPage = newPage;
  window.MC = window.MC || {};
  window.MC.S = S;
})();
