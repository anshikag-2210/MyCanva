/* MyCanvas Studio — element factories, shape catalog, original generated graphics. */
(function () {
  "use strict";
  const U = () => window.MC.U;

  /* ---------------- element factories ---------------- */
  const E = {};

  E.text = (text, opts) => Object.assign({
    id: U().uid("el"), type: "text",
    x: 100, y: 100, w: 400, h: 60, rot: 0, opacity: 1,
    text: text || "Text",
    font: "Segoe UI", size: 32, weight: 400, italic: false,
    color: "#1f2430", align: "left", ls: 0, lh: 1.25,
    underline: false,
  }, opts || {});

  E.shape = (shape, opts) => {
    const base = {
      rect: { w: 260, h: 160, fill: "#4f46e5", radius: 0 },
      round: { w: 260, h: 160, fill: "#4f46e5", radius: 24 },
      circle: { w: 200, h: 200, fill: "#0ea5e9", radius: 0 },
      triangle: { w: 220, h: 190, fill: "#f59e0b", radius: 0 },
      star: { w: 200, h: 200, fill: "#f59e0b", radius: 0 },
      heart: { w: 210, h: 190, fill: "#ef4444", radius: 0 },
      diamond: { w: 200, h: 200, fill: "#8b5cf6", radius: 0 },
      arrow: { w: 280, h: 140, fill: "#10b981", radius: 0 },
      ring: { w: 200, h: 200, fill: "#4f46e5", radius: 0 },
      line: { w: 320, h: 12, fill: "#1f2430", radius: 0 },
    }[shape] || { w: 200, h: 200, fill: "#4f46e5", radius: 0 };
    return Object.assign({
      id: U().uid("el"), type: "shape",
      x: 100, y: 100, rot: 0, opacity: 1,
      shape, stroke: null, sw: 4, dash: false,
    }, base, opts || {});
  };

  E.image = (src, opts) => Object.assign({
    id: U().uid("el"), type: "image",
    x: 100, y: 100, w: 360, h: 240, rot: 0, opacity: 1,
    src, fit: "cover", radius: 0,
  }, opts || {});

  E.graphic = (kind, opts) =>
    E.shape("graphic:" + kind, Object.assign({ w: 240, h: 240, fill: "#4f46e5" }, opts || {}));

  /* center a new element on the current page */
  E.centerOnPage = (el, page) => {
    el.x = Math.round((page.w - el.w) / 2);
    el.y = Math.round((page.h - el.h) / 2);
    return el;
  };

  /* recompute text element height from its wrapped lines */
  E.autoHeight = (el) => {
    if (el.type !== "text") return el;
    const lines = U().wrapText(el.text, el.font, el.size, el.weight, el.italic, Math.max(10, el.w));
    el.h = Math.max(el.size, Math.round(lines.length * el.size * el.lh) + el.size * 0.2);
    return el;
  };

  /* ---------------- shape path generation (unit 0..100 box) ----------------
   * Returns { d, strokeOnly?, fillRule? } used by both DOM render & canvas export. */
  const starD = (pts, R, r) => {
    let d = "";
    for (let i = 0; i < pts * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = (Math.PI * i) / pts - Math.PI / 2;
      const x = 50 + rad * Math.cos(a), y = 50 + rad * Math.sin(a);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
    }
    return d + "Z";
  };
  const heartD = "M50 86 C22 62 6 44 6 27 C6 12 17 4 28 4 C37 4 45 9 50 18 C55 9 63 4 72 4 C83 4 94 12 94 27 C94 44 78 62 50 86 Z";
  const arrowD = "M2 36 L58 36 L58 14 L98 50 L58 86 L58 64 L2 64 Z";
  const ringD = "M50 4 A46 46 0 1 1 49.99 4 Z M50 20 A30 30 0 1 0 50.01 20 Z";
  const zigzagD = "M4 70 L24 34 L44 70 L64 34 L84 70 L96 48";
  const waveD = "M0 50 C15 20 35 20 50 50 C65 80 85 80 100 50 L100 100 L0 100 Z";
  const sunD = starD(12, 48, 34);
  const confettiD =
    "M14 18 L30 10 L24 30 Z M58 8 L74 16 L62 28 Z M84 44 L96 58 L80 58 Z M10 56 L26 52 L18 68 Z M40 74 L58 70 L50 88 Z M74 78 L90 84 L76 94 Z";

  const GRAPHICS = {
    dots: {
      label: "Dot grid",
      svg: () => {
        let s = "";
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++)
          s += `<circle cx="${10 + i * 20}" cy="${10 + j * 20}" r="5" fill="COL"/>`;
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
      },
      canvas: (ctx, w, h, color) => {
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.arc((i + 0.5) * (w / 5), (j + 0.5) * (h / 5), (w / h >= 1 ? w : h) * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    rings: { label: "Rings", d: ringD, fillRule: "evenodd", icon: ringD },
    zigzag: { label: "Zigzag", d: zigzagD, strokeOnly: true, sw: 9, icon: zigzagD, strokeIcon: true },
    wave: { label: "Wave", d: waveD, icon: waveD },
    burst: { label: "Burst", d: sunD, icon: sunD },
    confetti: { label: "Confetti", d: confettiD, icon: confettiD },
  };

  const SHAPES = [
    { key: "rect", label: "Rectangle" },
    { key: "round", label: "Rounded" },
    { key: "circle", label: "Circle" },
    { key: "triangle", label: "Triangle" },
    { key: "star", label: "Star" },
    { key: "heart", label: "Heart" },
    { key: "diamond", label: "Diamond" },
    { key: "arrow", label: "Arrow" },
    { key: "ring", label: "Ring" },
    { key: "line", label: "Line" },
  ];

  /* icon svg (24px) for the left panel, colored with currentColor */
  E.shapeIcon = (key) => {
    const c = "currentColor";
    const box = "viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'";
    switch (key) {
      case "rect": return `<svg ${box}><rect x="8" y="20" width="84" height="60" rx="4" fill="${c}"/></svg>`;
      case "round": return `<svg ${box}><rect x="8" y="20" width="84" height="60" rx="22" fill="${c}"/></svg>`;
      case "circle": return `<svg ${box}><circle cx="50" cy="50" r="40" fill="${c}"/></svg>`;
      case "triangle": return `<svg ${box}><path d="M50 10 L92 88 L8 88 Z" fill="${c}"/></svg>`;
      case "star": return `<svg ${box}><path d="${starD(5, 44, 18)}" fill="${c}"/></svg>`;
      case "heart": return `<svg ${box}><path d="${heartD}" fill="${c}"/></svg>`;
      case "diamond": return `<svg ${box}><path d="M50 6 L94 50 L50 94 L6 50 Z" fill="${c}"/></svg>`;
      case "arrow": return `<svg ${box}><path d="${arrowD}" fill="${c}"/></svg>`;
      case "ring": return `<svg ${box}><path d="${ringD}" fill="${c}" fill-rule="evenodd"/></svg>`;
      case "line": return `<svg ${box}><line x1="6" y1="50" x2="94" y2="50" stroke="${c}" stroke-width="10" stroke-linecap="round"/></svg>`;
    }
    if (key && key.startsWith("graphic:")) {
      const g = GRAPHICS[key.slice(8)];
      if (!g) return "";
      if (g.d) {
        const fill = g.strokeOnly ? `fill='none' stroke='${c}' stroke-width='${g.sw}' stroke-linecap='round'` : `fill='${c}'`;
        return `<svg ${box}><path d='${g.d}' ${g.fillRule ? `fill-rule='${g.fillRule}'` : ""} ${fill}/></svg>`;
      }
      return g.svg().replace(/COL/g, c).replace("xmlns='http://www.w3.org/2000/svg'", "xmlns='http://www.w3.org/2000/svg'");
    }
    return "";
  };

  /* big icon for the elements panel (34px) */
  E.shapeIconBig = (key) => E.shapeIcon(key).replace("svg ", "svg style='width:34px;height:34px' ");

  E.SHAPES = SHAPES;
  E.GRAPHICS = GRAPHICS;
  E.starD = starD;
  E.heartD = heartD;
  E.arrowD = arrowD;
  E.ringD = ringD;
  E.zigzagD = zigzagD;
  E.waveD = waveD;
  E.sunD = sunD;
  E.confettiD = confettiD;

  /* ---------------- text style presets (left panel) ---------------- */
  E.TEXT_STYLES = [
    { label: "Heading", sample: "Big bold heading", opts: { size: 64, weight: 700, color: "#1f2430" } },
    { label: "Subheading", sample: "A clear subheading", opts: { size: 40, weight: 600, color: "#313a4c" } },
    { label: "Body text", sample: "Body copy for paragraphs and details that span a few lines.", opts: { size: 22, weight: 400, color: "#4b5563", lh: 1.45 } },
    { label: "Quote", sample: "“Make it simple.”", opts: { size: 36, weight: 400, italic: true, color: "#1f2430", align: "center", lh: 1.4 } },
    { label: "Caption", sample: "Small caption text", opts: { size: 16, weight: 500, color: "#6b7280", ls: 2 } },
  ];

  E.FONT_OPTIONS = [
    "Segoe UI", "Arial", "Georgia", "Times New Roman", "Verdana", "Trebuchet MS",
    "Courier New", "Impact", "Comic Sans MS", "Palatino Linotype",
  ];

  E.PALETTE = [
    "#1f2430", "#64748b", "#f8fafc", "#ffffff",
    "#4f46e5", "#8b5cf6", "#0ea5e9", "#10b981",
    "#f59e0b", "#f97316", "#ef4444", "#ec4899",
    "#14532d", "#1e3a5f", "#7c2d12", "#4a044e",
  ];

  window.MC = window.MC || {};
  window.MC.E = E;
})();
