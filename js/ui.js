/* MyCanvas Studio — UI: dashboard, left/right panels, topbar, modals, save. All original. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const U = () => window.MC.U;
  const E = () => window.MC.E;
  const R = () => window.MC.Render;
  const S = () => window.MC.S;
  const Store = () => window.MC.Store;
  const Exp = () => window.MC.Export;

  let leftTab = "elements";
  const tplThumbCache = {};

  /* ================= small helpers ================= */
  const UI = {};

  UI.toast = (msg) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(UI._toastT);
    UI._toastT = setTimeout(() => t.classList.add("hidden"), 2200);
  };

  UI.modal = ({ title, body, actions }) => {
    const root = $("modalRoot");
    root.innerHTML = "";
    const bd = document.createElement("div");
    bd.className = "modal-backdrop";
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<h3>${U().esc(title)}</h3><div class="modal-body">${body}</div>`;
    const act = document.createElement("div");
    act.className = "modal-actions";
    (actions || [{ label: "Close" }]).forEach((a) => {
      const b = document.createElement("button");
      b.className = "btn " + (a.primary ? "btn-primary" : "");
      b.textContent = a.label;
      b.addEventListener("click", () => {
        if (a.onClick) a.onClick();
        else root.innerHTML = "";
      });
      act.appendChild(b);
    });
    m.appendChild(act);
    bd.appendChild(m);
    bd.addEventListener("click", (ev) => { if (ev.target === bd) root.innerHTML = ""; });
    root.appendChild(bd);
  };

  UI.confirm = (msg, onYes) =>
    UI.modal({
      title: "Are you sure?",
      body: `<p style="font-size:14px;margin:0">${U().esc(msg)}</p>`,
      actions: [
        { label: "Cancel" },
        { label: "Yes, do it", primary: true, onClick: onYes },
      ],
    });

  /* ================= documents ================= */
  const defaultBrand = () => ({
    colors: ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#1f2430", "#f8fafc"],
    fonts: ["Segoe UI", "Georgia"],
  });

  UI.makeDocFromTemplate = (tpl) => {
    const built = tpl.make();
    return {
      id: U().uid("doc"),
      name: built.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      brand: defaultBrand(),
      pages: built.pages,
    };
  };

  UI.openDoc = (doc, opts) => {
    S().openDoc(doc);
    if (!opts || !opts.skipSave) Store().save(doc);
  };

  /* ================= screen switching ================= */
  UI.showDashboard = () => {
    $("editor").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    UI.renderDashboard();
  };

  UI.showEditor = () => {
    $("dashboard").classList.add("hidden");
    $("editor").classList.remove("hidden");
    if (!S().doc) return;
    R().refresh();
    UI.refreshTopbar();
    requestAnimationFrame(() => window.MC.Editor.fit());
  };

  /* ================= dashboard ================= */
  UI.renderDashboard = async () => {
    // projects
    const grid = $("projectGrid");
    const list = Store().list();
    grid.innerHTML = "";
    $("emptyProjects").classList.toggle("hidden", list.length > 0);
    list.forEach((entry) => {
      const d = entry.doc;
      const card = document.createElement("div");
      card.className = "project-card";
      card.innerHTML = `
        <div class="project-thumb" ${entry.thumb ? `style="background-image:url('${entry.thumb}')"` : ""}></div>
        <div class="meta"><span class="name">${U().esc(d.name)}</span><span class="date">${U().fmtDate(d.updatedAt)}</span></div>
        <div class="card-actions">
          <button class="iconbtn" data-act="dup" title="Duplicate">⧉</button>
          <button class="iconbtn danger" data-act="del" title="Delete">✕</button>
        </div>`;
      card.addEventListener("click", (ev) => {
        const act = ev.target.dataset && ev.target.dataset.act;
        if (act === "del") {
          ev.stopPropagation();
          UI.confirm(`Delete “${d.name}”? This cannot be undone.`, () => {
            Store().remove(d.id);
            UI.renderDashboard();
          });
          return;
        }
        if (act === "dup") {
          ev.stopPropagation();
          const c = Store().duplicate(d);
          UI.renderDashboard();
          UI.toast("Design duplicated");
          return;
        }
        UI.openDoc(Store().get(d.id));
      });
      grid.appendChild(card);
    });

    // templates
    const tgrid = $("templateGrid");
    tgrid.innerHTML = "";
    const q = ($("tplSearch").value || "").toLowerCase();
    for (const tpl of window.MC.TPL) {
      if (q && !(tpl.name.toLowerCase().includes(q) || tpl.cat.includes(q))) continue;
      const card = document.createElement("div");
      card.className = "tpl-card";
      card.innerHTML = `
        <div class="tpl-thumb" data-tpl="${tpl.id}"></div>
        <div class="meta"><div class="name">${U().esc(tpl.name)}</div><div class="cat">${tpl.cat}</div></div>`;
      card.addEventListener("click", () => {
        const doc = UI.makeDocFromTemplate(tpl);
        UI.openDoc(doc);
      });
      tgrid.appendChild(card);
      const thumbEl = card.querySelector(".tpl-thumb");
      if (tplThumbCache[tpl.id]) thumbEl.style.backgroundImage = `url('${tplThumbCache[tpl.id]}')`;
      else {
        (async () => {
          const built = tpl.make();
          const c = await Exp().renderPageAsync(built.pages[0], Math.min(1, 520 / built.pages[0].w));
          const url = c.toDataURL("image/jpeg", 0.82);
          tplThumbCache[tpl.id] = url;
          if (thumbEl.isConnected) thumbEl.style.backgroundImage = `url('${url}')`;
        })();
      }
    }
  };

  UI.newDesignModal = () => {
    UI.modal({
      title: "New blank design",
      body: `<div class="size-grid">${window.MC.S.SIZES.map(
        (s) => `<div class="size-opt" data-size="${s.key}"><span>${s.label}</span><span class="dim">${s.w} × ${s.h}</span></div>`
      ).join("")}</div>`,
      actions: [{ label: "Cancel" }],
    });
    $("modalRoot").querySelectorAll("[data-size]").forEach((opt) =>
      opt.addEventListener("click", () => {
        const size = window.MC.S.SIZES.find((s) => s.key === opt.dataset.size);
        const doc = UI.makeDocFromTemplate({
          make: () => ({ name: "Untitled design", pages: [S().newPage(size.w, size.h, "Page 1")] }),
        });
        $("modalRoot").innerHTML = "";
        UI.openDoc(doc);
      })
    );
  };

  /* ================= selection ================= */
  UI.selectEl = (id) => {
    S().sel = id;
    R().renderOverlay();
    R().renderLayers();
    UI.refreshProps();
  };

  /* ================= topbar ================= */
  UI.refreshTopbar = () => {
    const Ss = S();
    $("btnUndo").disabled = !Ss.canUndo();
    $("btnRedo").disabled = !Ss.canRedo();
    $("btnUndo").style.opacity = Ss.canUndo() ? 1 : .4;
    $("btnRedo").style.opacity = Ss.canRedo() ? 1 : .4;
    $("zoomLabel").textContent = Math.round((Ss.doc ? Ss.zoom : 1) * 100) + "%";
    const pn = $("projectName");
    if (document.activeElement !== pn && Ss.doc) pn.value = Ss.doc.name;
    const hasSel = !!Ss.selected();
    [["btnDup", hasSel], ["btnFront", hasSel], ["btnBackZ", hasSel], ["btnDelete", hasSel]].forEach(([id, on]) => {
      $(id).style.opacity = on ? 1 : .4;
      $(id).disabled = !on;
    });
  };

  /* ================= save ================= */
  UI.saveDoc = (regenThumb) => {
    const Ss = S();
    if (!Ss.doc) return;
    Ss.doc.updatedAt = Date.now();
    if (regenThumb) {
      Exp().makeThumb(Ss.page(), 480)
        .then((t) => Store().save(Ss.doc, t))
        .catch(() => Store().save(Ss.doc));
    } else Store().save(Ss.doc);
  };
  UI.scheduleSave = () => {
    clearTimeout(UI._saveT);
    UI._saveT = setTimeout(() => UI.saveDoc(true), 1500);
  };

  /* ================= left panel ================= */
  UI.setLeftTab = (tab) => {
    leftTab = tab;
    document.querySelectorAll("#toolRail button").forEach((b) =>
      b.classList.toggle("active", b.dataset.tool === tab)
    );
    const titles = { templates: "Templates", elements: "Elements", text: "Text", uploads: "Uploads", background: "Background", brand: "Brand kit" };
    $("leftPanelTitle").textContent = titles[tab];
    $("leftSearch").style.display = tab === "uploads" || tab === "background" || tab === "brand" ? "none" : "";
    $("leftSearch").value = "";
    UI.renderLeftPanel();
  };

  UI.renderLeftPanel = () => {
    const body = $("leftPanelBody");
    const q = ($("leftSearch").value || "").toLowerCase();
    body.innerHTML = "";

    if (leftTab === "templates") {
      body.innerHTML = `<div class="tpl-mini-grid">${window.MC.TPL.filter(
        (t) => !q || t.name.toLowerCase().includes(q)
      ).map((t) => `<div class="tpl-mini" data-tpl="${t.id}"><div class="t"></div><div class="l">${U().esc(t.name)}</div></div>`).join("")}</div>
      <p class="no-selection" style="margin-top:12px">Applying a template adds its pages to this design.</p>`;
      body.querySelectorAll("[data-tpl]").forEach((el) => {
        const tpl = window.MC.TPL.find((t) => t.id === el.dataset.tpl);
        const tEl = el.querySelector(".t");
        const paint = (url) => { if (tEl.isConnected) tEl.style.backgroundImage = `url('${url}')`; };
        if (tplThumbCache[tpl.id]) paint(tplThumbCache[tpl.id]);
        else {
          (async () => {
            const built = tpl.make();
            const c = await Exp().renderPageAsync(built.pages[0], Math.min(1, 300 / built.pages[0].w));
            const url = c.toDataURL("image/jpeg", 0.8);
            tplThumbCache[tpl.id] = url;
            paint(url);
          })();
        }
        el.addEventListener("click", () => UI.applyTemplateInDoc(tpl));
      });
    } else if (leftTab === "elements") {
      const items = [
        ...E().SHAPES.map((s) => ({ key: s.key, label: s.label })),
        ...Object.entries(E().GRAPHICS).map(([k, g]) => ({ key: "graphic:" + k, label: g.label })),
      ].filter((i) => !q || i.label.toLowerCase().includes(q));
      body.innerHTML = `<div class="shape-grid">${items.map((i) =>
        `<button class="shape-item" data-key="${i.key}" title="${U().esc(i.label)}">${E().shapeIcon(i.key)}<span class="cap">${U().esc(i.label)}</span></button>`
      ).join("")}</div>`;
      body.querySelectorAll("[data-key]").forEach((b) =>
        b.addEventListener("click", () => UI.addShape(b.dataset.key))
      );
    } else if (leftTab === "text") {
      const styles = E().TEXT_STYLES.filter((s) => !q || s.label.toLowerCase().includes(q));
      body.innerHTML = `<div class="text-styles">${styles.map((s) => {
        const o = s.opts;
        return `<div class="text-style-item" data-i="${E().TEXT_STYLES.indexOf(s)}"
          style="font-family:${o.font || "Segoe UI"};font-size:${Math.round(o.size * 0.5)}px;font-weight:${o.weight};font-style:${o.italic ? "italic" : "normal"};color:${o.color};text-align:${o.align || "left"};letter-spacing:${(o.ls || 0) * 0.5}px">${U().esc(s.sample)}</div>`;
      }).join("")}</div>`;
      body.querySelectorAll("[data-i]").forEach((d) =>
        d.addEventListener("click", () => UI.addTextStyle(parseInt(d.dataset.i, 10))
      ));
    } else if (leftTab === "uploads") {
      const up = (S().uploads[S().doc.id]) || [];
      body.innerHTML = `
        <div class="upload-grid">
          <div class="upload-add" id="uploadAdd">⬆&nbsp; Upload images<br><small>They're stored in this design (browser only).</small></div>
          ${up.map((u) => `<div class="upload-item" data-uid="${u.id}" title="${U().esc(u.name)}"><img src="${u.src}" alt=""></div>`).join("")}
        </div>`;
      const add = body.querySelector("#uploadAdd");
      if (add) add.addEventListener("click", () => $("fileInput").click());
      body.querySelectorAll("[data-uid]").forEach((d) =>
        d.addEventListener("click", () => UI.addUploadedImage(d.dataset.uid))
      );
    } else if (leftTab === "background") {
      UI.renderBgPanel(body);
    } else if (leftTab === "brand") {
      UI.renderBrandPanel(body);
    }
  };

  UI.applyTemplateInDoc = (tpl) => {
    const Ss = S();
    Ss.beginOp();
    const built = tpl.make();
    let firstIdx = Ss.doc.pages.length;
    built.pages.forEach((p) => { p.id = U().uid("pg"); Ss.doc.pages.push(p); });
    Ss.activePage = firstIdx;
    Ss.sel = null;
    Ss.commit({ type: "pages" });
    UI.toast(`Template “${tpl.name}” added`);
  };

  UI.addShape = (key) => {
    const Ss = S();
    const p = Ss.page();
    const el = key.startsWith("graphic:")
      ? E().graphic(key.slice(8))
      : E().shape(key);
    const pal = E().PALETTE;
    if (el.fill) el.fill = pal[(p.elements.length + 1) % (pal.length - 1)];
    E().centerOnPage(el, p);
    Ss.addElements([el], { type: "changed" });
  };

  UI.addTextStyle = (i) => {
    const Ss = S();
    const p = Ss.page();
    const st = E().TEXT_STYLES[i];
    const el = E().text(st.sample, Object.assign({ font: Ss.doc.brand.fonts[0] || "Segoe UI", w: Math.round(p.w * 0.6) }, st.opts));
    E().centerOnPage(el, p);
    E().autoHeight(el);
    Ss.addElements([el], { type: "changed" });
  };

  UI.addUploadedImage = (uid) => {
    const Ss = S();
    const p = Ss.page();
    const up = (S().uploads[S().doc.id] || []).find((u) => u.id === uid);
    if (!up) return;
    const k = Math.min(1, 560 / Math.max(up.w, up.h));
    const el = E().image(up.src, { w: Math.round(up.w * k), h: Math.round(up.h * k) });
    E().centerOnPage(el, p);
    Ss.addElements([el], { type: "changed" });
  };

  /* ---------- background ---------- */
  UI.renderBgPanel = (body) => {
    const Ss = S();
    const bg = Ss.page().bg;
    const up = (S().uploads[S().doc.id]) || [];
    const prev =
      bg.type === "gradient"
        ? `linear-gradient(${bg.angle || 45}deg, ${bg.c1}, ${bg.c2})`
        : bg.type === "image"
          ? `center/cover no-repeat url('${bg.src}')`
          : bg.color || "#ffffff";
    body.innerHTML = `
      <div class="bg-preview" style="background:${prev}"></div>
      <div class="prop-group"><span class="field-label">Solid color</span>
        <div class="swatch-row">${E().PALETTE.map((c) => `<button class="swatch" data-bgcolor="${c}" style="background:${c}"></button>`).join("")}</div>
        <div class="bg-row" style="margin-top:8px"><input type="color" id="bgCustomColor" value="${(bg.color || "#ffffff").startsWith("#") ? bg.color : "#ffffff"}"><span style="font-size:12px;color:var(--ink-soft)">custom</span></div>
      </div>
      <div class="prop-group"><span class="field-label">Gradient</span>
        <div class="bg-row"><input type="color" id="bgC1" value="${bg.c1 || "#4f46e5"}"><input type="color" id="bgC2" value="${bg.c2 || "#0ea5e9"}"></div>
        <div class="bg-row"><input type="range" id="bgAngle" min="0" max="360" value="${bg.angle == null ? 45 : bg.angle}"></div>
      </div>
      <div class="prop-group"><span class="field-label">Image</span>
        <select id="bgImgSel">
          <option value="">— choose an uploaded image —</option>
          ${up.map((u) => `<option value="${u.id}">${U().esc(u.name)}</option>`).join("")}
        </select>
        <button class="btn small" id="bgImgClear" style="margin-top:8px">Remove image background</button>
      </div>`;
    const setBg = (nb) => {
      Ss.beginOp();
      Ss.page().bg = nb;
      Ss.commit({ type: "changed" });
    };
    body.querySelectorAll("[data-bgcolor]").forEach((b) =>
      b.addEventListener("click", () => setBg({ type: "color", color: b.dataset.bgcolor }))
    );
    body.querySelector("#bgCustomColor").addEventListener("input", (ev) => setBg({ type: "color", color: ev.target.value }));
    const applyGrad = () => setBg({
      type: "gradient",
      c1: body.querySelector("#bgC1").value,
      c2: body.querySelector("#bgC2").value,
      angle: parseInt(body.querySelector("#bgAngle").value, 10),
    });
    ["#bgC1", "#bgC2", "#bgAngle"].forEach((id) => body.querySelector(id).addEventListener("change", applyGrad));
    body.querySelector("#bgImgSel").addEventListener("change", (ev) => {
      const u = up.find((x) => x.id === ev.target.value);
      if (u) setBg({ type: "image", src: u.src });
    });
    body.querySelector("#bgImgClear").addEventListener("click", () => setBg({ type: "color", color: "#ffffff" }));
  };

  /* ---------- brand ---------- */
  UI.renderBrandPanel = (body) => {
    const Ss = S();
    body.innerHTML = `
      <div class="prop-group"><span class="field-label">Brand colors</span>
        <div class="brand-palette">${Ss.doc.brand.colors.map((c, i) =>
          `<input type="color" data-bc="${i}" value="${c}" title="Brand color ${i + 1}">`).join("")}</div>
        <p class="no-selection">Brand colors appear as quick swatches in every fill control.</p>
      </div>
      <div class="prop-group"><span class="field-label">Brand fonts</span>
        <div class="brand-fonts">
          <select data-bf="0">${E().FONT_OPTIONS.map((f) => `<option ${f === Ss.doc.brand.fonts[0] ? "selected" : ""}>${f}</option>`).join("")}</select>
          <select data-bf="1">${E().FONT_OPTIONS.map((f) => `<option ${f === Ss.doc.brand.fonts[1] ? "selected" : ""}>${f}</option>`).join("")}</select>
        </div>
      </div>`;
    body.querySelectorAll("[data-bc]").forEach((inp) =>
      inp.addEventListener("change", () => {
        Ss.beginOp();
        Ss.doc.brand.colors[parseInt(inp.dataset.bc, 10)] = inp.value;
        Ss.commit({ type: "changed" });
      })
    );
    body.querySelectorAll("[data-bf]").forEach((inp) =>
      inp.addEventListener("change", () => {
        Ss.beginOp();
        Ss.doc.brand.fonts[parseInt(inp.dataset.bf, 10)] = inp.value;
        Ss.commit({ type: "changed" });
      })
    );
  };

  /* ================= right panel (properties) ================= */
  const numField = (label, prop, val, opts) =>
    `<div class="prop-row"><label>${label}</label><input type="number" data-prop="${prop}" value="${U().round(val, 1)}"
      ${opts.min != null ? `min="${opts.min}"` : ""} ${opts.max != null ? `max="${opts.max}"` : ""} step="${opts.step || 1}"></div>`;

  const paletteRow = (extra) => {
    const Ss = S();
    const colors = [...(Ss.doc ? Ss.doc.brand.colors : []), ...E().PALETTE.slice(0, 10)];
    return `<div class="swatch-row" style="margin-top:6px">${colors.map((c) =>
      `<button class="swatch" data-pick="${c}" style="background:${c}" title="${c}"></button>`).join("")}</div>${extra || ""}`;
  };

  UI.refreshProps = () => {
    const Ss = S();
    const body = $("rightPanelBody");
    if (!Ss.doc) { body.innerHTML = ""; return; }
    const el = Ss.selected();
    if (!el) {
      $("rightPanelTitle").textContent = "Page";
      const p = Ss.page();
      body.innerHTML = `
        <div class="prop-group"><span class="field-label">Page name</span>
          <input type="text" id="pgName" value="${U().esc(p.name)}"></div>
        <div class="prop-group"><span class="field-label">Size (px)</span>
          <div class="prop-row"><label>Width</label><input type="number" id="pgW" value="${p.w}" min="100"></div>
          <div class="prop-row"><label>Height</label><input type="number" id="pgH" value="${p.h}" min="100"></div></div>
        <p class="no-selection">Tip: select an element to edit its properties. Double-click text to edit it in place.</p>`;
      body.querySelector("#pgName").addEventListener("change", (ev) => {
        Ss.beginOp(); p.name = ev.target.value || "Page"; Ss.commit({ type: "pages" });
      });
      const setSize = () => {
        const w = parseInt(body.querySelector("#pgW").value, 10);
        const h = parseInt(body.querySelector("#pgH").value, 10);
        if (isNaN(w) || isNaN(h) || w < 100 || h < 100) return;
        Ss.beginOp(); p.w = w; p.h = h; Ss.commit({ type: "changed" });
      };
      body.querySelector("#pgW").addEventListener("change", setSize);
      body.querySelector("#pgH").addEventListener("change", setSize);
      return;
    }

    $("rightPanelTitle").textContent = el.type === "text" ? "Text" : el.type === "image" ? "Image" : "Shape";
    let html = `
      <div class="prop-group"><span class="field-label">Position & size</span>
        <div class="prop-row"><label>X</label><input type="number" data-prop="x" value="${U().round(el.x)}"></div>
        <div class="prop-row"><label>Y</label><input type="number" data-prop="y" value="${U().round(el.y)}"></div>
        <div class="prop-row"><label>Width</label><input type="number" data-prop="w" value="${U().round(el.w)}" min="1"></div>
        <div class="prop-row"><label>Height</label><input type="number" data-prop="h" value="${U().round(el.h)}" min="1"></div>
        <div class="prop-row"><label>Rotate</label><input type="number" data-prop="rot" value="${el.rot || 0}" min="0" max="360"></div>
        <div class="prop-row"><label>Opacity</label><input type="range" data-prop="opacity" data-pct="1" min="0" max="100" value="${Math.round((el.opacity == null ? 1 : el.opacity) * 100)}"></div>
      </div>
      <div class="prop-group"><span class="field-label">Align to page</span>
        <div class="align-grid">
          <button data-align="left" title="Align left">⇤</button>
          <button data-align="centerX" title="Center horizontally">⇹</button>
          <button data-align="right" title="Align right">⇥</button>
          <button data-align="top" title="Align top">⤒</button>
          <button data-align="centerY" title="Center vertically">⊸</button>
          <button data-align="bottom" title="Align bottom">⤓</button>
        </div>
      </div>`;

    if (el.type === "text") {
      html += `
      <div class="prop-group"><span class="field-label">Style</span>
        <select data-prop="font">${E().FONT_OPTIONS.map((f) => `<option ${f === el.font ? "selected" : ""}>${f}</option>`).join("")}</select></div>
      <div class="prop-group"><span class="field-label">Typography</span>
        ${numField("Size", "size", el.size, { min: 6, step: 1 })}
        <div class="prop-row"><label>Weight</label><select data-prop="weight"><option value="400" ${el.weight == 400 ? "selected" : ""}>Regular</option><option value="500" ${el.weight == 500 ? "selected" : ""}>Medium</option><option value="700" ${el.weight == 700 ? "selected" : ""}>Bold</option><option value="800" ${el.weight == 800 ? "selected" : ""}>Heavy</option></select></div>
        <div class="prop-row"><label>Spacing</label><input type="number" data-prop="ls" value="${el.ls || 0}" min="0"></div>
        <div class="prop-row"><label>Line ht</label><input type="number" data-prop="lh" value="${el.lh || 1.25}" min="0.8" max="3" step="0.05"></div>
        <div class="align-grid" style="margin-top:6px">
          <button data-talign="left">Left</button><button data-talign="center">Center</button><button data-talign="right">Right</button>
        </div>
        <div class="prop-row" style="margin-top:8px"><label style="width:auto"><input type="checkbox" data-check="italic" ${el.italic ? "checked" : ""} style="width:auto;margin-right:6px">Italic</label></div>
        <div class="prop-row"><label style="width:auto"><input type="checkbox" data-check="underline" ${el.underline ? "checked" : ""} style="width:auto;margin-right:6px">Underline</label></div>
      </div>
      <div class="prop-group"><span class="field-label">Color</span>
        <div class="bg-row"><input type="color" data-colorprop="1" value="${el.color}"><span style="font-size:12px;color:var(--ink-soft)">text color</span></div>
        ${paletteRow()}
      </div>`;
    } else if (el.type === "image") {
      html += `
      <div class="prop-group"><span class="field-label">Image</span>
        <div class="prop-row"><label>Fit</label><select data-prop="fit"><option value="cover" ${el.fit === "cover" ? "selected" : ""}>Cover (crop)</option><option value="contain" ${el.fit === "contain" ? "selected" : ""}>Fit inside</option></select></div>
        ${numField("Corner radius", "radius", el.radius || 0, { min: 0, max: 400 })}
      </div>`;
    } else {
      const fillTarget = el.type === "shape" && (el.shape === "line" || el.shape.startsWith("graphic:zigzag")) ? "stroke (line color)" : "fill";
      html += `
      <div class="prop-group"><span class="field-label">${fillTarget}</span>
        <div class="bg-row"><input type="color" data-colorprop="1" value="${(el.fill && el.fill !== "none") ? el.fill : "#4f46e5"}"></div>
        ${paletteRow(el.fill && el.fill !== "none" ? '<button class="btn small" data-nofill="1" style="margin-top:8px">No fill</button>' : "")}
      </div>
      <div class="prop-group"><span class="field-label">Border</span>
        <div class="bg-row"><input type="color" data-strokeprop="1" value="${el.stroke || "#1f2430"}">
          <button class="btn small" data-stroketoggle="1">${el.stroke ? "Remove" : "Add"}</button></div>
        ${el.stroke ? numField("Width", "sw", el.sw || 4, { min: 1, max: 60 }) +
          '<div class="prop-row"><label style="width:auto"><input type="checkbox" data-check="dash" ' + (el.dash ? "checked" : "") + ' style="width:auto;margin-right:6px">Dashed</label></div>' : ""}
      </div>`;
      if (el.shape === "rect" || el.shape === "round") {
        html += `<div class="prop-group">${numField("Corner radius", "radius", el.radius == null ? 0 : el.radius, { min: 0, max: 400 })}</div>`;
      }
    }

    html += `
      <div class="prop-group" style="display:flex;gap:8px">
        <button class="btn small" data-act="dup" style="flex:1">Duplicate</button>
        <button class="btn small" data-act="front" style="flex:1">Front</button>
        <button class="btn small" data-act="back" style="flex:1">Back</button>
        <button class="btn small" data-act="del" style="flex:1;border-color:var(--danger);color:var(--danger)">Delete</button>
      </div>`;

    body.innerHTML = html;

    // delegated handlers
    body.querySelectorAll("[data-prop]").forEach((inp) =>
      inp.addEventListener("change", (ev) => UI.commitProp(el, ev.target))
    );
    body.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => {
        const patch = el.type === "text" ? { color: b.dataset.pick } :
          (el.shape === "line" || el.shape === "graphic:zigzag") ? { fill: b.dataset.pick } : { fill: b.dataset.pick };
        Ss.updateElement(el.id, patch, { type: "changed" });
      })
    );
    body.querySelectorAll("[data-align]").forEach((b) =>
      b.addEventListener("click", () => UI.commitAlign(el, b.dataset.align))
    );
    body.querySelectorAll("[data-talign]").forEach((b) =>
      b.addEventListener("click", () => Ss.updateElement(el.id, { align: b.dataset.talign }, { type: "changed" }))
    );
    body.querySelectorAll("[data-check]").forEach((c) =>
      c.addEventListener("change", () => Ss.updateElement(el.id, { [c.dataset.check]: c.checked }, { type: "changed" }))
    );
    body.querySelectorAll("[data-colorprop]").forEach((c) =>
      c.addEventListener("change", () => Ss.updateElement(el.id, el.type === "text" ? { color: c.value } : { fill: c.value }, { type: "changed" }))
    );
    body.querySelectorAll("[data-strokeprop]").forEach((c) =>
      c.addEventListener("change", () => Ss.updateElement(el.id, { stroke: c.value }, { type: "changed" }))
    );
    const st = body.querySelector("[data-stroketoggle]");
    if (st) st.addEventListener("click", () => Ss.updateElement(el.id, { stroke: el.stroke ? null : "#1f2430", sw: el.sw || 4 }, { type: "changed" }));
    const nf = body.querySelector("[data-nofill]");
    if (nf) nf.addEventListener("click", () => Ss.updateElement(el.id, { fill: "none" }, { type: "changed" }));
    body.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => {
        const a = b.dataset.act;
        if (a === "dup") Ss.duplicateSelected();
        if (a === "front") Ss.bringToFront(el.id);
        if (a === "back") Ss.sendToBack(el.id);
        if (a === "del") Ss.removeElement(el.id);
      })
    );
  };

  UI.commitProp = (el, inp) => {
    const Ss = S();
    let v = inp.value;
    if (inp.type === "number") v = parseFloat(v);
    if (inp.type === "range" && inp.dataset.pct) v = v / 100;
    if (typeof v === "number" && isNaN(v)) return;
    const prop = inp.dataset.prop;
    const patch = { [prop]: v };
    if (el.type === "text" && ["w", "size", "font", "lh"].includes(prop)) {
      Ss.beginOp();
      el[prop] = v;
      E().autoHeight(el);
      Ss.commit({ type: "changed" });
      return;
    }
    Ss.updateElement(el.id, patch, { type: "changed" });
  };

  UI.commitAlign = (el, which) => {
    const Ss = S();
    const p = Ss.page();
    const patch = {};
    if (which === "left") patch.x = 0;
    if (which === "right") patch.x = p.w - el.w;
    if (which === "centerX") patch.x = (p.w - el.w) / 2;
    if (which === "top") patch.y = 0;
    if (which === "bottom") patch.y = p.h - el.h;
    if (which === "centerY") patch.y = (p.h - el.h) / 2;
    Ss.updateElement(el.id, patch, { type: "changed" });
  };

  /* ================= upload handling ================= */
  UI.handleFiles = async (files) => {
    const Ss = S();
    const docId = Ss.doc.id;
    Ss.uploads[docId] = Ss.uploads[docId] || [];
    for (const f of files) {
      try {
        const raw = await U().fileToDataUrl(f);
        const d = await U().downscaleImage(raw, 1400);
        Ss.uploads[docId].push({ id: U().uid("up"), name: f.name, src: d.src, w: d.w, h: d.h });
      } catch (e) { console.warn("upload failed", e); }
    }
    UI.renderLeftPanel();
    UI.toast(`${files.length} image(s) added to Uploads`);
  };

  /* ================= export menu ================= */
  UI.runExport = async (kind) => {
    $("exportMenu").classList.add("hidden");
    try {
      if (kind === "png") { await Exp().exportPng(1); UI.toast("PNG exported"); }
      if (kind === "png2") { await Exp().exportPng(2); UI.toast("PNG (2×) exported"); }
      if (kind === "svg") { Exp().exportSvg(); UI.toast("SVG exported"); }
      if (kind === "pdf") { await Exp().exportPdf(); UI.toast("PDF exported"); }
      UI.saveDoc(true);
    } catch (e) {
      console.error(e);
      UI.toast("Export failed — see console");
    }
  };

  /* ================= init ================= */
  UI.init = () => {
    // state events
    S().on((ev) => {
      switch (ev.type) {
        case "moved": R().renderBoard(); R().renderOverlay(); break;
        case "changed": R().refresh(); UI.scheduleSave(); break;
        case "history": UI.refreshTopbar(); break;
        case "page": R().refresh(); break;
        case "restored": R().refresh(); UI.scheduleSave(); break;
        case "opened": UI.showEditor(); break;
      }
    });

    // dashboard
    $("btnNewProject").addEventListener("click", UI.newDesignModal);
    $("tplSearch").addEventListener("input", U().debounce(UI.renderDashboard, 200));

    // topbar
    $("btnBack").addEventListener("click", () => { UI.saveDoc(false); UI.showDashboard(); });
    $("btnUndo").addEventListener("click", () => S().undo());
    $("btnRedo").addEventListener("click", () => S().redo());
    $("btnZoomIn").addEventListener("click", () => window.MC.Editor.setZoom(S().zoom * 1.2));
    $("btnZoomOut").addEventListener("click", () => window.MC.Editor.setZoom(S().zoom / 1.2));
    $("btnZoomFit").addEventListener("click", () => window.MC.Editor.fit());
    $("btnDup").addEventListener("click", () => S().duplicateSelected());
    $("btnFront").addEventListener("click", () => { const e = S().selected(); if (e) S().bringToFront(e.id); });
    $("btnBackZ").addEventListener("click", () => { const e = S().selected(); if (e) S().sendToBack(e.id); });
    $("btnDelete").addEventListener("click", () => { const e = S().selected(); if (e) S().removeElement(e.id); });
    $("btnSave").addEventListener("click", () => { UI.saveDoc(true); UI.toast("Saved to this browser"); });
    $("projectName").addEventListener("change", (ev) => {
      const Ss = S();
      if (!Ss.doc) return;
      Ss.beginOp();
      Ss.doc.name = ev.target.value.trim() || "Untitled design";
      Ss.commit({ type: "history" });
      UI.saveDoc(false);
    });

    // export dropdown
    $("btnExport").addEventListener("click", (ev) => {
      ev.stopPropagation();
      $("exportMenu").classList.toggle("hidden");
    });
    document.addEventListener("click", () => $("exportMenu").classList.add("hidden"));
    $("exportMenu").querySelectorAll("[data-export]").forEach((b) =>
      b.addEventListener("click", (ev) => { ev.stopPropagation(); UI.runExport(b.dataset.export); })
    );

    // rail
    $("toolRail").querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => UI.setLeftTab(b.dataset.tool))
    );
    $("leftSearch").addEventListener("input", UI.renderLeftPanel);

    // uploads
    $("fileInput").addEventListener("change", (ev) => {
      UI.handleFiles([...ev.target.files]);
      ev.target.value = "";
    });

    // import design (dashboard)
    const imp = document.createElement("button");
    imp.className = "btn";
    imp.textContent = "Import design (.json)";
    const fimp = document.createElement("input");
    fimp.type = "file"; fimp.accept = ".json,application/json"; fimp.hidden = true;
    imp.addEventListener("click", () => fimp.click());
    fimp.addEventListener("change", async () => {
      const f = fimp.files[0];
      if (!f) return;
      try {
        const doc = Store().importJson(await f.text());
        UI.openDoc(doc);
        UI.toast("Design imported");
      } catch (e) {
        UI.toast("Import failed: not a valid design file");
      }
      fimp.value = "";
    });
    const dashActions = document.querySelector(".dash-actions");
    dashActions.appendChild(fimp);
    dashActions.appendChild(imp);

    // default left tab
    UI.setLeftTab("elements");
  };

  window.MC = window.MC || {};
  window.MC.UI = UI;
})();
