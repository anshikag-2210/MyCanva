/* MyCanvas Studio — SVG rendering: artboard, selection overlay, layers, page strip. All original. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const U = () => window.MC.U;
  const E = () => window.MC.E;

  /* ================= element -> SVG group ================= */
  function textLines(el) {
    return U().wrapText(el.text, el.font, el.size, el.weight, el.italic, Math.max(10, el.w));
  }

  function textNode(el) {
    const lines = textLines(el);
    const anchor = el.align === "center" ? "middle" : el.align === "right" ? "end" : "start";
    const x = el.align === "center" ? el.w / 2 : el.align === "right" ? el.w : 0;
    const firstY = el.size * 0.92;
    const dy = el.size * (el.lh || 1.25);
    const tspans = lines.map((ln, i) =>
      `<tspan x="${x}" y="${firstY + i * dy}">${U().esc(ln === "" ? " " : ln)}</tspan>`
    ).join("");
    const deco = el.underline ? ` text-decoration="underline"` : "";
    return `<text font-family="${U().esc(el.font)}" font-size="${el.size}" font-weight="${el.weight}"
      ${el.italic ? 'font-style="italic"' : ""} fill="${el.color}" text-anchor="${anchor}"
      letter-spacing="${el.ls || 0}"${deco}>${tspans}</text>`;
  }

  function shapeNode(el) {
    const w = el.w, h = el.h;
    const fill = el.fill || "none";
    const stroke = el.stroke ? ` stroke="${el.stroke}" stroke-width="${el.sw || 4}"${el.dash ? ' stroke-dasharray="10 8"' : ""}` : "";
    const op = el.opacity != null && el.opacity < 1 ? ` opacity="${el.opacity}"` : "";
    switch (el.shape) {
      case "rect":
        return `<path d="${roundedRect(0, 0, w, h, el.radius || 0)}" fill="${fill}"${stroke}${op}/>`;
      case "round":
        return `<path d="${roundedRect(0, 0, w, h, el.radius == null ? Math.min(w, h) * 0.12 : el.radius)}" fill="${fill}"${stroke}${op}/>`;
      case "graphic:wave":
        return `<path d="${scaleD(E().waveD, w, h)}" fill="${fill}"${stroke}${op}/>`;
      case "graphic:confetti":
        return `<path d="${scaleD(E().confettiD, w, h)}" fill="${fill}"${stroke}${op}/>`;
      case "circle":
        return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}"${stroke}${op}/>`;
      case "triangle":
        return `<path d="M${w / 2} 0 L${w} ${h} L0 ${h} Z" fill="${fill}"${stroke}${op}/>`;
      case "star":
        return `<path d="${scaleD(E().starD(5, 50, 20), w, h)}" fill="${fill}"${stroke}${op}/>`;
      case "heart":
        return `<path d="${scaleD(E().heartD, w, h)}" fill="${fill}"${stroke}${op}/>`;
      case "diamond":
        return `<path d="M${w / 2} 0 L${w} ${h / 2} L${w / 2} ${h} L0 ${h / 2} Z" fill="${fill}"${stroke}${op}/>`;
      case "arrow":
        return `<path d="${scaleD(E().arrowD, w, h)}" fill="${fill}"${stroke}${op}/>`;
      case "ring":
      case "graphic:ring":
      case "graphic:rings":
        if (el.stroke) {
          return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="none" stroke="${el.stroke}" stroke-width="${el.sw || Math.min(w, h) * 0.1}"${op}/>`;
        }
        return `<path d="${scaleD(E().ringD, w, h)}" fill="${el.fill || "#4f46e5"}" fill-rule="evenodd"${op}/>`;
      case "line":
        return `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${fill}" stroke-width="${Math.max(2, h)}" stroke-linecap="round"${op}/>`;
      case "graphic:dots": {
        let s = "";
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++)
          s += `<circle cx="${((i + 0.5) * w) / 5}" cy="${((j + 0.5) * h) / 5}" r="${Math.min(w, h) * 0.05}" fill="${fill}"/>`;
        return `<g${op}>${s}</g>`;
      }
      case "graphic:zigzag":
        return `<path d="${scaleD(E().zigzagD, w, h)}" fill="none" stroke="${fill}" stroke-width="${Math.min(w, h) * 0.09}" stroke-linecap="round" stroke-linejoin="round"${op}/>`;
      case "graphic:burst":
        return `<path d="${scaleD(E().sunD, w, h)}" fill="${fill}"${stroke}${op}/>`;
    }
    return `<rect width="${w}" height="${h}" fill="${fill}"${stroke}${op}/>`;
  }

  function roundedRect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (r <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  }

  /* path scaler for generated 0..100-box paths — understands each command's
     parameter layout (H/V single-axis, A arcs, C/Q/S pair runs) */
  function scaleD(d, w, h) {
    const rx = (v) => (v / 100) * w;
    const ry = (v) => (v / 100) * h;
    const toks = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    let out = "", i = 0;
    const num = () => parseFloat(toks[i++]);
    const isNum = (t) => t != null && !/[A-Za-z]/.test(t);
    while (i < toks.length) {
      const c = toks[i];
      if (isNum(c)) { i++; continue; } // stray coordinate (implicit repeat) — none in our paths
      i++;
      out += c;
      if (c === "M" || c === "L" || c === "T" || c === "C" || c === "S" || c === "Q") {
        while (i < toks.length && isNum(toks[i])) out += rx(num()).toFixed(2) + " " + ry(num()).toFixed(2) + " ";
      } else if (c === "H") {
        while (i < toks.length && isNum(toks[i])) out += rx(num()).toFixed(2) + " ";
      } else if (c === "V") {
        while (i < toks.length && isNum(toks[i])) out += ry(num()).toFixed(2) + " ";
      } else if (c === "A" || c === "a") {
        while (i + 6 < toks.length + 1 && isNum(toks[i])) {
          const rrx = num(), rry = num(), rot = num(), laf = num(), sf = num(), x = num(), y = num();
          out += rx(rrx).toFixed(2) + " " + ry(rry).toFixed(2) + " " + rot + " " + laf + " " + sf + " " + rx(x).toFixed(2) + " " + ry(y).toFixed(2) + " ";
        }
      }
      // Z / z carry no parameters
    }
    return out.trim();
  }

  function imageNode(el) {
    const fit = el.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice";
    const clip = el.radius ? ` clip-path="url(#clip_${el.id})"` : "";
    const op = el.opacity != null && el.opacity < 1 ? ` opacity="${el.opacity}"` : "";
    return `<g${clip}>
      <image x="0" y="0" width="${el.w}" height="${el.h}" href="${el.src}" preserveAspectRatio="${fit}"${op}/>
    </g>`;
  }

  function elNode(el) {
    const cx = el.w / 2, cy = el.h / 2;
    const rot = el.rot ? `rotate(${el.rot} ${cx} ${cy})` : "";
    const vis = el.hidden ? ' display="none"' : "";
    const inner = el.type === "text" ? textNode(el) : el.type === "image" ? imageNode(el) : shapeNode(el);
    return `<g data-el="${el.id}" transform="translate(${el.x} ${el.y}) ${rot}"${vis}>${inner}</g>`;
  }

  /* ================= page -> SVG markup ================= */
  function bgMarkup(page, idPrefix) {
    const bg = page.bg;
    if (bg.type === "gradient") {
      const g = U().niceGradient(bg.c1, bg.c2, bg.angle);
      const gid = idPrefix + "g";
      return {
        defs: `<linearGradient id="${gid}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}"><stop offset="0" stop-color="${bg.c1}"/><stop offset="1" stop-color="${bg.c2}"/></linearGradient>`,
        rect: `<rect width="${page.w}" height="${page.h}" fill="url(#${gid})"/>`,
      };
    }
    if (bg.type === "image") {
      return {
        defs: "",
        rect: `<image x="0" y="0" width="${page.w}" height="${page.h}" href="${bg.src}" preserveAspectRatio="xMidYMid slice"/>`,
      };
    }
    return { defs: "", rect: `<rect width="${page.w}" height="${page.h}" fill="${bg.color || "#ffffff"}"/>` };
  }

  function pageMarkup(page, idPrefix) {
    const bg = bgMarkup(page, idPrefix || "bg");
    const clips = page.elements
      .filter((e) => e.type === "image" && e.radius)
      .map((e) => `<clipPath id="clip_${e.id}"><path d="${roundedRect(0, 0, e.w, e.h, e.radius)}"/></clipPath>`)
      .join("");
    const els = page.elements.map((e) => elNode(e)).join("");
    return `<defs>${bg.defs}${clips}</defs>${bg.rect}${els}`;
  }

  /* ================= artboard ================= */
  function renderBoard() {
    const S = window.MC.S;
    if (!S.doc) return;
    const page = S.page();
    const board = $("board"), stage = $("stage");
    board.style.width = page.w + "px";
    board.style.height = page.h + "px";
    board.style.transform = "scale(" + S.zoom + ")";
    board.style.setProperty("--inv", (1 / S.zoom).toFixed(4));
    const wrap = $("boardWrap");
    wrap.style.width = Math.ceil(page.w * S.zoom) + 80 + "px";
    wrap.style.height = Math.ceil(page.h * S.zoom) + 80 + "px";
    stage.setAttribute("width", page.w);
    stage.setAttribute("height", page.h);
    stage.setAttribute("viewBox", `0 0 ${page.w} ${page.h}`);
    stage.innerHTML = pageMarkup(page, "a");
  }

  function renderOverlay() {
    const S = window.MC.S;
    const ov = $("overlay");
    if (!S.doc) return;
    const el = S.selected();
    ov.innerHTML = "";
    if (!el) return;
    const box = document.createElement("div");
    box.className = "sel-box";
    box.style.left = el.x + "px";
    box.style.top = el.y + "px";
    box.style.width = el.w + "px";
    box.style.height = el.h + "px";
    if (el.rot) box.style.transform = `rotate(${el.rot}deg)`;
    box.style.borderWidth = (1.5 * (1 / S.zoom)).toFixed(2) + "px";

    const stem = document.createElement("div");
    stem.className = "sel-stem";
    box.appendChild(stem);
    const rot = document.createElement("div");
    rot.className = "sel-rotate";
    rot.dataset.handle = "rot";
    rot.style.width = rot.style.height = (10 / S.zoom).toFixed(2) + "px";
    rot.style.top = (-26 / S.zoom).toFixed(2) + "px";
    box.appendChild(rot);
    ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((h) => {
      const d = document.createElement("div");
      d.className = "sel-handle " + h;
      d.dataset.handle = h;
      d.style.width = d.style.height = (9 / S.zoom).toFixed(2) + "px";
      box.appendChild(d);
    });
    ov.appendChild(box);
  }

  function showGuides(guides) {
    const ov = $("overlay");
    ov.querySelectorAll(".guide-v,.guide-h").forEach((n) => n.remove());
    (guides || []).forEach((g) => {
      const d = document.createElement("div");
      d.className = g.axis === "v" ? "guide-v" : "guide-h";
      if (g.axis === "v") d.style.left = g.pos + "px";
      else d.style.top = g.pos + "px";
      ov.appendChild(d);
    });
  }

  /* ================= layers panel ================= */
  function renderLayers() {
    const S = window.MC.S;
    const body = $("layersBody");
    if (!S.doc) return;
    const els = S.page().elements;
    body.innerHTML = "";
    if (!els.length) {
      body.innerHTML = '<div class="no-selection">No elements on this page yet.</div>';
      return;
    }
    [...els].reverse().forEach((e) => {
      const row = document.createElement("div");
      row.className = "layer-row" + (S.sel === e.id ? " active" : "") + (e.hidden ? " dim" : "");
      const ico = e.type === "text" ? "T" : e.type === "image" ? "▣" : e.shape && e.shape.startsWith("graphic") ? "✳" : "◯";
      let name;
      if (e.type === "text") name = (e.text.slice(0, 24) || "Text");
      else if (e.type === "image") name = "Image";
      else {
        const gkey = String(e.shape || "").replace("graphic:", "");
        const gl = E().GRAPHICS[gkey] || E().GRAPHICS[gkey + "s"];
        name = E().SHAPES.find((s) => s.key === e.shape) ? E().SHAPES.find((s) => s.key === e.shape).label : gl ? gl.label : (e.shape || "Shape");
      }
      row.innerHTML = `<span class="ico">${ico}</span><span class="lname">${U().esc(name)}</span>
        <button class="lbtn" data-act="vis" title="Show/hide">${e.hidden ? "◌" : "●"}</button>
        <button class="lbtn" data-act="up" title="Bring forward">↑</button>
        <button class="lbtn" data-act="down" title="Send backward">↓</button>`;
      row.addEventListener("click", (ev) => {
        const act = ev.target.dataset && ev.target.dataset.act;
        if (act === "vis") { S.updateElement(e.id, { hidden: !e.hidden }, { type: "changed" }); return; }
        if (act === "up" || act === "down") {
          const p = S.page();
          const i = p.elements.findIndex((x) => x.id === e.id);
          const j = act === "up" ? i + 1 : i - 1;
          if (j < 0 || j >= p.elements.length) return;
          S.beginOp();
          [p.elements[i], p.elements[j]] = [p.elements[j], p.elements[i]];
          p.elements.forEach((x, k) => (x.z = k));
          S.pushHistory({ type: "changed" });
          return;
        }
        S.sel = e.id;
        window.MC.UI.refreshProps();
        renderOverlay();
      });
      body.appendChild(row);
    });
  }

  /* ================= page strip ================= */
  function renderPageStrip() {
    const S = window.MC.S;
    const strip = $("pageStrip");
    if (!S.doc) return;
    strip.innerHTML = "";
    S.doc.pages.forEach((p, i) => {
      const t = document.createElement("div");
      t.className = "page-thumb" + (i === S.activePage ? " active" : "");
      const mini = document.createElement("div");
      mini.className = "mini";
      mini.innerHTML = `<svg viewBox="0 0 ${p.w} ${p.h}" style="width:100%;height:100%">${pageMarkup(p, "t" + i)}</svg>`;
      t.appendChild(mini);
      t.insertAdjacentHTML("beforeend", `<span class="num">${i + 1}</span><button class="page-del" title="Delete page">✕</button>`);
      t.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("page-del")) {
          if (S.doc.pages.length <= 1) { window.MC.UI.toast("A design needs at least one page"); return; }
          S.removePage(i);
        } else S.setActivePage(i);
      });
      strip.appendChild(t);
    });
    const add = document.createElement("button");
    add.className = "page-add";
    add.title = "Add page";
    add.textContent = "+";
    add.addEventListener("click", () => S.addPage({}));
    strip.appendChild(add);
  }

  /* ================= full refresh ================= */
  function refresh() {
    renderBoard();
    renderOverlay();
    renderLayers();
    renderPageStrip();
    window.MC.UI.refreshProps();
    window.MC.UI.refreshTopbar();
  }

  window.MC = window.MC || {};
  window.MC.Render = {
    pageMarkup, elNode, renderBoard, renderOverlay, renderLayers, renderPageStrip,
    showGuides, refresh, textLines, roundedRect, scaleD, bgMarkup,
  };
  // editor.js defines window.MC.Editor; referenced above after load
  window.MC.Render.renderOverlay = renderOverlay;
})();
