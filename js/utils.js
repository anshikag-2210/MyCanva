/* MyCanvas Studio — small utilities. All original. */
(function () {
  "use strict";
  const U = {};

  U.uid = (p) => (p || "id") + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.round = (v, n) => { const f = Math.pow(10, n == null ? 2 : n); return Math.round(v * f) / f; };
  U.deg2rad = (d) => (d * Math.PI) / 180;

  U.clone = (o) => (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

  U.esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---- colors ---- */
  U.hexToRgb = (hex) => {
    let h = String(hex || "").trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    if (isNaN(n) || h.length !== 6) return { r: 0, g: 0, b: 0 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  U.rgbToHex = ({ r, g, b }) =>
    "#" + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  U.withAlpha = (hex, a) => {
    const { r, g, b } = U.hexToRgb(hex);
    return `rgba(${r},${g},${b},${U.clamp(a == null ? 1 : a, 0, 1)})`;
  };
  U.relativeLuma = (hex) => {
    const { r, g, b } = U.hexToRgb(hex);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  U.contrastText = (hex) => (U.relativeLuma(hex) > 0.55 ? "#1f2430" : "#ffffff");

  U.niceGradient = (c1, c2, angle) => {
    const a = U.deg2rad(angle);
    // map angle to svg gradient coordinates over a 0..1 box
    const x = Math.cos(a), y = Math.sin(a);
    return {
      x1: 0.5 - x / 2, y1: 0.5 - y / 2, x2: 0.5 + x / 2, y2: 0.5 + y / 2, c1, c2
    };
  };

  /* ---- DOM ---- */
  U.el = (tag, attrs, kids) => {
    const ns = tag === "svg" || tag === "path" || tag === "rect" || tag === "circle" || tag === "ellipse" ||
      tag === "line" || tag === "polygon" || tag === "polyline" || tag === "text" || tag === "tspan" ||
      tag === "image" || tag === "g" || tag === "defs" || tag === "linearGradient" || tag === "stop" ||
      tag === "clipPath" || tag === "foreignObject";
    const node = ns
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach((k) => k && node.appendChild(k));
    return node;
  };

  /* ---- files ---- */
  U.download = (filename, blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  U.downloadText = (filename, text, mime) => U.download(filename, new Blob([text], { type: mime || "text/plain" }));
  U.fileToDataUrl = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  /* downscale an image data-url so projects stay localStorage-friendly */
  U.downscaleImage = (dataUrl, maxDim) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, (maxDim || 1200) / Math.max(img.width, img.height));
        if (scale >= 1) return resolve({ src: dataUrl, w: img.width, h: img.height });
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve({ src: c.toDataURL("image/jpeg", 0.85), w: c.width, h: c.height });
      };
      img.onerror = () => resolve({ src: dataUrl, w: 800, h: 600 });
      img.src = dataUrl;
    });

  U.loadImage = (src) =>
    new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src; });

  /* text measurement + word wrap (shared by editor & exporters) */
  const _mctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  U.measureFont = (font, size, weight, italic) => {
    if (!_mctx) return (s) => s.length * size * 0.55;
    _mctx.font = `${italic ? "italic " : ""}${weight || 400} ${size}px ${font}`;
    return (s) => _mctx.measureText(s).width;
  };
  U.wrapText = (text, font, size, weight, italic, maxWidth) => {
    const meas = U.measureFont(font, size, weight, italic);
    const out = [];
    String(text).split("\n").forEach((para) => {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(""); return; }
      let line = "";
      for (const w of words) {
        const trial = line ? line + " " + w : w;
        if (meas(trial) <= maxWidth || !line) line = trial;
        else { out.push(line); line = w; }
      }
      out.push(line);
    });
    return out;
  };

  /* deterministic pseudo-random for generated graphics */
  U.rng = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  U.fmtDate = (ts) => {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  U.debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 250); };
  };

  window.MC = window.MC || {};
  window.MC.U = U;
})();
