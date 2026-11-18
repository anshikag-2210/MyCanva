/* MyCanvas Studio — export: PNG (canvas), SVG, PDF (minimal writer, JPEG-embedded), JSON. All original. */
(function () {
  "use strict";
  const U = () => window.MC.U;
  const R = () => window.MC.Render;
  const E = () => window.MC.E;

  /* ================= canvas renderer (mirrors SVG artboard) ================= */
  async function renderPageAsync(page, scale) {
    const srcs = new Set();
    if (page.bg && page.bg.type === "image") srcs.add(page.bg.src);
    page.elements.forEach((e) => e.type === "image" && srcs.add(e.src));
    const entries = await Promise.all([...srcs].map(async (s) => [s, await U().loadImage(s)]));
    const img = new Map(entries);

    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(page.w * scale));
    c.height = Math.max(1, Math.round(page.h * scale));
    const ctx = c.getContext("2d");
    ctx.scale(scale, scale);
    ctx.imageSmoothingQuality = "high";
    drawPage(ctx, page, img);
    return c;
  }

  function drawPage(ctx, page, imgCache) {
    const bg = page.bg;
    if (bg.type === "gradient") {
      const g = U().niceGradient(bg.c1, bg.c2, bg.angle);
      const lg = ctx.createLinearGradient(g.x1 * page.w, g.y1 * page.h, g.x2 * page.w, g.y2 * page.h);
      lg.addColorStop(0, bg.c1);
      lg.addColorStop(1, bg.c2);
      ctx.fillStyle = lg;
    } else if (bg.type === "image") {
      const im = imgCache.get(bg.src);
      if (im) { drawFitted(ctx, im, page.w, page.h, "cover"); return drawElements(ctx, page, imgCache); }
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = bg.color || "#ffffff";
    }
    ctx.fillRect(0, 0, page.w, page.h);
    drawElements(ctx, page, imgCache);
  }

  function drawElements(ctx, page, imgCache) {
    for (const el of page.elements) {
      if (el.hidden) continue;
      ctx.save();
      ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
      if (el.rot) ctx.rotate(U().deg2rad(el.rot));
      ctx.translate(-el.w / 2, -el.h / 2);
      ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
      if (el.type === "text") drawText(ctx, el);
      else if (el.type === "image") drawImageEl(ctx, el, imgCache);
      else drawShape(ctx, el);
      ctx.restore();
    }
  }

  function drawText(ctx, el) {
    ctx.fillStyle = el.color;
    ctx.font = `${el.italic ? "italic " : ""}${el.weight || 400} ${el.size}px ${el.font}`;
    try { if (el.ls) ctx.letterSpacing = el.ls + "px"; } catch (e) { /* older engines */ }
    const align = el.align === "center" ? "center" : el.align === "right" ? "right" : "left";
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    const x = el.align === "center" ? el.w / 2 : el.align === "right" ? el.w : 0;
    const lines = U().wrapText(el.text, el.font, el.size, el.weight, el.italic, Math.max(10, el.w));
    const dy = el.size * (el.lh || 1.25);
    lines.forEach((ln, i) => {
      const y = el.size * 0.92 + i * dy;
      ctx.fillText(ln, x, y);
      if (el.underline && ln) {
        const w = ctx.measureText(ln).width;
        let x0 = x, x1 = x + w;
        if (align === "center") { x0 = x - w / 2; x1 = x + w / 2; }
        if (align === "right") { x0 = x - w; x1 = x; }
        ctx.fillRect(x0, y + el.size * 0.08, w, Math.max(1, el.size / 16));
      }
    });
    try { ctx.letterSpacing = "0px"; } catch (e) { /* noop */ }
  }

  function drawFitted(ctx, im, w, h, fit) {
    const s = fit === "contain" ? Math.min(w / im.width, h / im.height) : Math.max(w / im.width, h / im.height);
    const dw = im.width * s, dh = im.height * s;
    ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function drawImageEl(ctx, el, imgCache) {
    const im = imgCache.get(el.src);
    if (!im) return;
    ctx.save();
    if (el.radius) ctx.clip(new Path2D(R().roundedRect(0, 0, el.w, el.h, el.radius)));
    drawFitted(ctx, im, el.w, el.h, el.fit || "cover");
    ctx.restore();
  }

  function drawShape(ctx, el) {
    const w = el.w, h = el.h;
    const d = (unit) => R().scaleD(unit, w, h);
    const fill = el.fill && el.fill !== "none";
    const path = (p) => {
      if (fill) { ctx.fillStyle = el.fill; ctx.fill(p); }
      if (el.stroke) { ctx.strokeStyle = el.stroke; ctx.lineWidth = el.sw || 4; ctx.setLineDash(el.dash ? [10, 8] : []); ctx.stroke(p); }
      ctx.setLineDash([]);
    };
    switch (el.shape) {
      case "rect": path(new Path2D(R().roundedRect(0, 0, w, h, el.radius || 0))); break;
      case "round": path(new Path2D(R().roundedRect(0, 0, w, h, el.radius == null ? Math.min(w, h) * 0.12 : el.radius))); break;
      case "circle": {
        const p = new Path2D();
        p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        path(p); break;
      }
      case "triangle": path(new Path2D(`M${w / 2} 0 L${w} ${h} L0 ${h} Z`)); break;
      case "diamond": path(new Path2D(`M${w / 2} 0 L${w} ${h / 2} L${w / 2} ${h} L0 ${h / 2} Z`)); break;
      case "star": path(new Path2D(d(E().starD(5, 50, 20)))); break;
      case "heart": path(new Path2D(d(E().heartD))); break;
      case "arrow": path(new Path2D(d(E().arrowD))); break;
      case "wave":
      case "graphic:wave": path(new Path2D(d(E().waveD))); break;
      case "burst":
      case "graphic:burst": path(new Path2D(d(E().sunD))); break;
      case "confetti":
      case "graphic:confetti": path(new Path2D(d(E().confettiD))); break;
      case "ring":
      case "graphic:ring":
      case "graphic:rings":
        if (el.stroke) {
          const p = new Path2D();
          p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.strokeStyle = el.stroke;
          ctx.lineWidth = el.sw || Math.min(w, h) * 0.1;
          ctx.stroke(p);
        } else {
          ctx.fillStyle = el.fill || "#4f46e5";
          ctx.fill(new Path2D(d(E().ringD)), "evenodd");
        }
        break;
      case "line": {
        ctx.strokeStyle = el.fill || "#1f2430";
        ctx.lineWidth = Math.max(2, h);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        break;
      }
      case "dots":
      case "graphic:dots": {
        ctx.fillStyle = el.fill || "#4f46e5";
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.arc(((i + 0.5) * w) / 5, ((j + 0.5) * h) / 5, Math.min(w, h) * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "zigzag":
      case "graphic:zigzag": {
        ctx.strokeStyle = el.fill || "#4f46e5";
        ctx.lineWidth = Math.min(w, h) * 0.09;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(new Path2D(d(E().zigzagD)));
        break;
      }
      case "graphic:wave": path(new Path2D(d(E().waveD))); break;
      case "graphic:confetti": path(new Path2D(d(E().confettiD))); break;
      default: path(new Path2D(`M0 0H${w}V${h}H0Z`));
    }
  }

  /* ================= exports ================= */
  const slug = (s) => String(s || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "design";

  async function exportPng(scale) {
    const S = window.MC.S;
    const page = S.page();
    const canvas = await renderPageAsync(page, scale || 1);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const suffix = S.doc.pages.length > 1 ? `-p${S.activePage + 1}` : "";
    U().download(`${slug(S.doc.name)}${suffix}.png`, blob);
    return true;
  }

  function exportSvg() {
    const S = window.MC.S;
    const page = S.page();
    const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${page.w}" height="${page.h}" viewBox="0 0 ${page.w} ${page.h}">${R().pageMarkup(page, "x")}</svg>`;
    const suffix = S.doc.pages.length > 1 ? `-p${S.activePage + 1}` : "";
    U().downloadText(`${slug(S.doc.name)}${suffix}.svg`, doc, "image/svg+xml");
    return true;
  }

  function exportJson() {
    const S = window.MC.S;
    U().downloadText(`${slug(S.doc.name)}.mycanvas.json`, JSON.stringify(S.doc, null, 2), "application/json");
  }

  /* -------- minimal PDF (JPEG-embedded pages, no dependencies) -------- */
  function makePdf(jpegs) {
    const te = new TextEncoder();
    const enc = (s) => te.encode(s);
    const chunks = [];
    let len = 0;
    const push = (b) => { chunks.push(b); len += b.length; };
    const offsets = new Array(2 + 3 * jpegs.length + 1).fill(0);
    push(enc("%PDF-1.4\n%âãÏÓ\n"));
    const addObj = (num, body) => { offsets[num] = len; push(enc(num + " 0 obj\n" + body + "\nendobj\n")); };
    const kids = jpegs.map((_, i) => (3 + 3 * i) + " 0 R").join(" ");
    addObj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    addObj(2, `<< /Type /Pages /Kids [${kids}] /Count ${jpegs.length} >>`);
    jpegs.forEach((jp, i) => {
      const pNum = 3 + 3 * i, cNum = pNum + 1, iNum = pNum + 2;
      const content = `q ${jp.w} 0 0 ${jp.h} 0 0 cm /Im0 Do Q`;
      addObj(pNum,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${jp.w} ${jp.h}] ` +
        `/Resources << /XObject << /Im0 ${iNum} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${cNum} 0 R >>`);
      addObj(cNum, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      offsets[iNum] = len;
      push(enc(iNum + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + jp.w + " /Height " + jp.h +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jp.data.length + " >>\nstream\n"));
      push(jp.data);
      push(enc("\nendstream\nendobj\n"));
    });
    const xrefStart = len;
    const total = 2 + 3 * jpegs.length;
    let xref = "xref\n0 " + (total + 1) + "\n0000000000 65535 f \n";
    for (let k = 1; k <= total; k++) xref += String(offsets[k]).padStart(10, "0") + " 00000 n \n";
    xref += `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    push(enc(xref));
    const out = new Uint8Array(len);
    let p = 0;
    for (const c of chunks) { out.set(c, p); p += c.length; }
    return new Blob([out], { type: "application/pdf" });
  }

  const canvasToJpeg = (canvas) =>
    new Promise((res) => canvas.toBlob((b) => {
      if (!b) return res(null);
      b.arrayBuffer().then((ab) => res(new Uint8Array(ab)));
    }, "image/jpeg", 0.92));

  async function exportPdf() {
    const S = window.MC.S;
    const jpegs = [];
    for (const page of S.doc.pages) {
      const canvas = await renderPageAsync(page, 1);
      const data = await canvasToJpeg(canvas);
      if (!data) continue;
      jpegs.push({ w: canvas.width, h: canvas.height, data });
    }
    if (!jpegs.length) return false;
    U().download(`${slug(S.doc.name)}.pdf`, makePdf(jpegs));
    return true;
  }

  /* small jpeg thumb for dashboard cards */
  async function makeThumb(page, maxW) {
    const scale = (maxW || 420) / page.w;
    const canvas = await renderPageAsync(page, Math.min(scale, 1));
    return canvas.toDataURL("image/jpeg", 0.72);
  }

  window.MC = window.MC || {};
  window.MC.Export = { exportPng, exportSvg, exportJson, exportPdf, makePdf, makeThumb, renderPageAsync };
})();
