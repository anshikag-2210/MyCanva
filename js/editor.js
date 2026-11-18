/* MyCanvas Studio — editor interactions: select, move, resize, rotate, text edit, zoom. All original. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const U = () => window.MC.U;
  const E = () => window.MC.E;
  const R = () => window.MC.Render;

  const Editor = { drag: null, editing: false };

  /* ---------- coordinate helpers ---------- */
  const boardPoint = (clientX, clientY) => {
    const S = window.MC.S;
    const r = $("board").getBoundingClientRect();
    return { x: (clientX - r.left) / S.zoom, y: (clientY - r.top) / S.zoom };
  };

  /* ---------- snapping ---------- */
  function snapCandidates(excludeId) {
    const S = window.MC.S;
    const p = S.page();
    const v = [0, p.w / 2, p.w];
    const h = [0, p.h / 2, p.h];
    for (const o of p.elements) {
      if (o.id === excludeId || o.hidden) continue;
      v.push(o.x, o.x + o.w / 2, o.x + o.w);
      h.push(o.y, o.y + o.h / 2, o.y + o.h);
    }
    return { v, h };
  }
  function snapAxis(pos, size, targets, th) {
    let best = null;
    for (const off of [0, size / 2, size]) {
      for (const t of targets) {
        const d = t - (pos + off);
        if (Math.abs(d) <= th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, t };
      }
    }
    return best;
  }

  /* ---------- drag lifecycle ---------- */
  function startDrag(mode, ev, extra) {
    const S = window.MC.S;
    const el = S.selected();
    if (!el) return;
    S.beginOp(); // snapshot pre-drag state
    Editor.drag = Object.assign({
      mode,
      startPt: boardPoint(ev.clientX, ev.clientY),
      orig: { x: el.x, y: el.y, w: el.w, h: el.h, rot: el.rot },
    }, extra || {});
    document.body.style.userSelect = "none";
  }

  function onMove(ev) {
    const S = window.MC.S;
    const d = Editor.drag;
    if (!d) return;
    const el = S.el(S.sel);
    if (!el) return;
    d.moved = true;
    const p = boardPoint(ev.clientX, ev.clientY);
    const th = 6 / S.zoom;

    if (d.mode === "move") {
      let nx = d.orig.x + (p.x - d.startPt.x);
      let ny = d.orig.y + (p.y - d.startPt.y);
      const cand = snapCandidates(el.id);
      const sv = snapAxis(nx, el.w, cand.v, th);
      const sh = snapAxis(ny, el.h, cand.h, th);
      const guides = [];
      if (sv) { nx += sv.d; guides.push({ axis: "v", pos: sv.t }); }
      if (sh) { ny += sh.d; guides.push({ axis: "h", pos: sh.t }); }
      el.x = U().round(nx, 2);
      el.y = U().round(ny, 2);
      R().showGuides(guides);
    } else if (d.mode === "resize") {
      const o = d.orig;
      const rad = U().deg2rad(o.rot);
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      // pointer in local (unrotated) space relative to center
      const dx = p.x - cx, dy = p.y - cy;
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      const hd = d.handle;
      const sx = hd.includes("e") ? 1 : hd.includes("w") ? -1 : 0;
      const sy = hd.includes("s") ? 1 : hd.includes("n") ? -1 : 0;
      const ax = -sx * o.w / 2, ay = -sy * o.h / 2; // anchor (opposite corner/edge), local
      let nw = o.w, nh = o.h;
      if (sx) nw = Math.max(12, Math.abs(lx - ax) * (sx > 0 ? 1 : 1));
      if (sy) nh = Math.max(12, Math.abs(ly - ay));
      // keep aspect for corner handles with Shift held
      if (ev.shiftKey && sx && sy) {
        const k = Math.max(nw / o.w, nh / o.h);
        nw = o.w * k; nh = o.h * k;
      }
      const clx = sx ? (lx + ax) / 2 : 0; // new center, local
      const cly = sy ? (ly + ay) / 2 : 0;
      const gdx = clx * cos - cly * sin;
      const gdy = clx * sin + cly * cos;
      el.w = U().round(nw, 2);
      el.h = U().round(nh, 2);
      el.x = U().round(cx + gdx - nw / 2, 2);
      el.y = U().round(cy + gdy - nh / 2, 2);
      if (el.type === "text") E().autoHeight(el);
      el.x = U().round(cx + gdx - el.w / 2, 2);
      el.y = U().round(cy + gdy - el.h / 2, 2);
    } else if (d.mode === "rotate") {
      const o = d.orig;
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      let ang = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      if (ev.shiftKey) ang = U().round(ang, 1);
      else ang = Math.round(ang / 15) * 15;
      el.rot = ((ang % 360) + 360) % 360;
    }
    S.beginTransient({ type: "moved" });
  }

  function endDrag() {
    const Ss = window.MC.S;
    if (!Editor.drag) return;
    const moved = !!Editor.drag.moved;
    Editor.drag = null;
    document.body.style.userSelect = "";
    R().showGuides([]);
    if (moved) Ss.commit({ type: "changed" });
    else Ss.abortOp();
  }

  /* ---------- selection ---------- */
  function selectFromEvent(ev) {
    const S = window.MC.S;
    const g = ev.target.closest && ev.target.closest("g[data-el]");
    if (g) {
      const id = g.getAttribute("data-el");
      if (S.sel !== id) window.MC.UI.selectEl(id);
      else { R().renderOverlay(); }
      return true;
    }
    if (S.sel) window.MC.UI.selectEl(null);
    return false;
  }

  /* ---------- text editing ---------- */
  function startTextEdit(id) {
    const S = window.MC.S;
    const el = S.el(id);
    if (!el || el.type !== "text") return;
    Editor.editing = true;
    const wrap = $("textEditWrap"), ta = $("textEdit");
    const br = $("board").getBoundingClientRect();
    const z = S.zoom;
    const left = br.left + el.x * z;
    const top = br.top + el.y * z;
    wrap.classList.remove("hidden");
    wrap.style.left = left + "px";
    wrap.style.top = top + "px";
    wrap.style.width = el.w * z + "px";
    wrap.style.height = el.h * z + "px";
    if (el.rot) wrap.style.transform = `rotate(${el.rot}deg)`;
    wrap.style.transformOrigin = "center";
    ta.value = el.text;
    ta.style.font = `${el.italic ? "italic " : ""}${el.weight} ${el.size * z}px ${el.font}`;
    ta.style.color = el.color;
    ta.style.textAlign = el.align;
    ta.style.letterSpacing = (el.ls || 0) * z + "px";
    ta.style.lineHeight = el.lh || 1.25;
    ta.style.width = "100%";
    ta.style.height = "100%";
    ta.focus();
    ta.select();
    const commit = () => {
      document.removeEventListener("keydown", onKey, true);
      ta.removeEventListener("blur", commit);
      wrap.classList.add("hidden");
      Editor.editing = false;
      const val = ta.value;
      if (val !== el.text) {
        el.text = val.replace(/\n{3,}/g, "\n\n");
        E().autoHeight(el);
        S.pushHistory({ type: "changed" });
      }
    };
    const onKey = (ev) => {
      if (ev.key === "Escape") { ev.preventDefault(); ta.blur(); }
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); ta.blur(); }
      ev.stopPropagation();
    };
    document.addEventListener("keydown", onKey, true);
    ta.addEventListener("blur", commit);
  }

  /* ---------- zoom ---------- */
  function setZoom(z, clientX, clientY) {
    const S = window.MC.S;
    if (!S.doc) return;
    z = U().clamp(z, 0.05, 4);
    const scroll = $("canvasScroll");
    const br = $("board").getBoundingClientRect();
    const mx = ((clientX != null ? clientX : br.left + br.width / 2) - br.left) / S.zoom;
    const my = ((clientY != null ? clientY : br.top + br.height / 2) - br.top) / S.zoom;
    S.zoom = z;
    R().renderBoard();
    requestAnimationFrame(() => {
      const b2 = $("board").getBoundingClientRect();
      scroll.scrollLeft += b2.left + mx * z - (clientX != null ? clientX : b2.left + b2.width / 2);
      scroll.scrollTop += b2.top + my * z - (clientY != null ? clientY : b2.top + b2.height / 2);
    });
    window.MC.UI.refreshTopbar();
    R().renderOverlay();
  }

  function fit() {
    const S = window.MC.S;
    if (!S.doc) return;
    const p = S.page();
    const sc = $("canvasScroll");
    const z = Math.min((sc.clientWidth - 90) / p.w, (sc.clientHeight - 90) / p.h, 1.25);
    setZoom(Math.max(0.05, z));
  }

  /* ---------- wiring ---------- */
  function init() {
    const stage = $("stage"), scroll = $("canvasScroll"), overlay = $("overlay");

    stage.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || Editor.editing) return;
      const g = ev.target.closest && ev.target.closest("g[data-el]");
      if (g) {
        const id = g.getAttribute("data-el");
        window.MC.UI.selectEl(id);
        startDrag("move", ev);
        stage.setPointerCapture(ev.pointerId);
      } else {
        if (window.MC.S.sel) window.MC.UI.selectEl(null);
      }
    });

    overlay.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || !window.MC.S.sel) return;
      const h = ev.target.dataset && ev.target.dataset.handle;
      if (!h) return;
      ev.stopPropagation();
      if (h === "rot") startDrag("rotate", ev);
      else startDrag("resize", ev, { handle: h });
      overlay.setPointerCapture(ev.pointerId);
    });

    stage.addEventListener("dblclick", (ev) => {
      const g = ev.target.closest && ev.target.closest("g[data-el]");
      if (g) {
        const id = g.getAttribute("data-el");
        const el = window.MC.S.el(id);
        if (el && el.type === "text") startTextEdit(id);
      }
    });

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    scroll.addEventListener("wheel", (ev) => {
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault();
        setZoom(window.MC.S.zoom * (ev.deltaY < 0 ? 1.12 : 0.89), ev.clientX, ev.clientY);
      }
    }, { passive: false });

    window.addEventListener("keydown", (ev) => {
      const ae = document.activeElement;
      const typing = ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT" || ae.isContentEditable);
      if (typing || Editor.editing) return;
      const S = window.MC.S;
      if (!S.doc) return;
      const mod = ev.ctrlKey || ev.metaKey;
      const el = S.selected();
      if (mod && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        if (ev.shiftKey) S.redo(); else S.undo();
        return;
      }
      if (mod && ev.key.toLowerCase() === "y") { ev.preventDefault(); S.redo(); return; }
      if (mod && ev.key.toLowerCase() === "d") { ev.preventDefault(); S.duplicateSelected(); return; }
      if (ev.key === "Delete" || ev.key === "Backspace") {
        if (el) { ev.preventDefault(); S.removeElement(el.id); }
        return;
      }
      if (ev.key === "Escape") { if (S.sel) window.MC.UI.selectEl(null); return; }
      if (el && ev.key.startsWith("Arrow")) {
        ev.preventDefault();
        const step = ev.shiftKey ? 10 : 1;
        const dx = ev.key === "ArrowLeft" ? -step : ev.key === "ArrowRight" ? step : 0;
        const dy = ev.key === "ArrowUp" ? -step : ev.key === "ArrowDown" ? step : 0;
        S.beginOp();
        el.x += dx; el.y += dy;
        S.commit({ type: "changed" });
      }
    });
  }

  Editor.init = init;
  Editor.setZoom = setZoom;
  Editor.fit = fit;
  Editor.boardPoint = boardPoint;
  window.MC = window.MC || {};
  window.MC.Editor = Editor;
})();
