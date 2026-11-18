/* Browser smoke test for MyCanvas Studio (needs system Edge or Chromium).
   Run: node tests/browser.mjs */
import { chromium } from "playwright-core";

const EXE = process.platform === "win32"
  ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  : "/usr/bin/google-chrome";
const URL = "file:///D:/Project/rea/projects/myCanva/index.html";

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + String(e)));

let failures = 0;
const check = (name, cond, extra = "") => {
  console.log((cond ? "PASS" : "FAIL") + "  " + name + (extra ? "  [" + extra + "]" : ""));
  if (!cond) failures++;
};

await page.goto(URL);
await page.waitForTimeout(600);

/* ---- dashboard ---- */
const tplCount = await page.locator(".tpl-card").count();
check("dashboard lists templates", tplCount >= 8, String(tplCount));
await page.waitForTimeout(800);
const thumbsPainted = await page.evaluate(() =>
  [...document.querySelectorAll(".tpl-thumb")].filter((t) => t.style.backgroundImage).length
);
check("template thumbnails rendered", thumbsPainted >= 8, String(thumbsPainted));

/* ---- open first template (Quote Post) ---- */
await page.locator(".tpl-card").first().click();
await page.waitForTimeout(400);
check("editor visible", await page.locator("#editor").isVisible());
const elCount = await page.locator("#stage g[data-el]").count();
check("artboard rendered elements", elCount >= 5, String(elCount));
check("page strip built", (await page.locator(".page-thumb").count()) >= 1);

/* ---- add a solid rect (reliable drag target), then select + drag with a real mouse ---- */
await page.click('[data-tool="elements"]');
await page.locator(".shape-item").first().click();
await page.waitForTimeout(200);
const elCount2 = await page.locator("#stage g[data-el]").count();
check("shape added from panel", elCount2 === elCount + 1, `${elCount}->${elCount2}`);

const target = await page.evaluate(() => {
  const el = [...window.MC.S.page().elements].reverse().find((e) => e.type === "shape" && e.shape === "rect");
  const br = document.getElementById("board").getBoundingClientRect();
  const z = window.MC.S.zoom;
  return { id: el.id, cx: br.left + (el.x + el.w / 2) * z, cy: br.top + (el.y + el.h / 2) * z };
});
await page.mouse.move(target.cx, target.cy);
await page.mouse.down();
await page.mouse.move(target.cx + 70, target.cy + 50, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(150);
const dragOk = await page.evaluate((id) => {
  const el = window.MC.S.el(id);
  return window.MC.S.sel === id && el && (Math.abs(el.x - 410) > 30 || Math.abs(el.y - 460) > 30);
}, target.id);
check("real-mouse drag moved the element", !!dragOk);
check("undo enabled after drag", await page.evaluate(() => window.MC.S.canUndo()));

const posRoundTrip = await page.evaluate(async (id) => {
  const e = window.MC.S.el(id);
  const before = { x: e.x, y: e.y };
  window.MC.S.undo();
  const undone = { x: window.MC.S.el(id).x, y: window.MC.S.el(id).y };
  window.MC.S.redo();
  const after = { x: window.MC.S.el(id).x, y: window.MC.S.el(id).y };
  return { before, undone, after };
}, target.id);
check("undo reverts the drag", posRoundTrip.undone.x !== posRoundTrip.before.x || posRoundTrip.undone.y !== posRoundTrip.before.y);
check("redo restores the drag", posRoundTrip.after.x === posRoundTrip.before.x && posRoundTrip.after.y === posRoundTrip.before.y);

/* ---- property panel commit (re-select: undo/redo clears selection) ---- */
const t2 = await page.evaluate((id) => {
  const el = window.MC.S.el(id);
  const br = document.getElementById("board").getBoundingClientRect();
  const z = window.MC.S.zoom;
  return { cx: br.left + (el.x + el.w / 2) * z, cy: br.top + (el.y + el.h / 2) * z };
}, target.id);
await page.mouse.click(t2.cx, t2.cy);
await page.waitForTimeout(150);
check("re-selected element", await page.evaluate((id) => window.MC.S.sel === id, target.id));
await page.locator("#rightPanelBody [data-prop='opacity']").first().fill("40");
await page.locator("#rightPanelBody [data-prop='opacity']").first().dispatchEvent("change");
const opacity = await page.evaluate(() => window.MC.S.selected().opacity);
check("opacity property commits", opacity === 0.4, String(opacity));

/* ---- resize via se handle ---- */
const wBefore = await page.evaluate(() => window.MC.S.selected().w);
const hb = await page.locator(".sel-handle.se").boundingBox();
await page.mouse.move(hb.x + 1, hb.y + 1);
await page.mouse.down();
await page.mouse.move(hb.x + 1 + 50, hb.y + 1 + 25, { steps: 4 });
await page.mouse.up();
await page.waitForTimeout(150);
const wAfter = await page.evaluate(() => window.MC.S.selected().w);
check("resize via handle", Math.abs(wAfter - wBefore) > 20, `${wBefore} -> ${wAfter}`);

/* ---- text editing (synthetic dblclick avoids SVG glyph hit-testing) ---- */
const textId = await page.evaluate(() => {
  const e = window.MC.S.page().elements.find((x) => x.type === "text");
  return e ? e.id : null;
});
check("found a text element", !!textId);
if (textId) {
  await page.evaluate((id) => {
    const g = document.querySelector(`#stage g[data-el="${id}"]`);
    g.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));
  }, textId);
  await page.waitForTimeout(200);
  check("text editor opened", await page.evaluate(() => !document.getElementById("textEditWrap").classList.contains("hidden")));
  await page.evaluate(() => { document.getElementById("textEdit").value = "Hello from the smoke test"; });
  await page.keyboard.press("Control+Enter");
  await page.waitForTimeout(200);
  const committed = await page.evaluate((id) => {
    const e = window.MC.S.el(id);
    return document.getElementById("textEditWrap").classList.contains("hidden") && e.text.startsWith("Hello from the smoke test");
  }, textId);
  check("text edit committed", !!committed);
}

/* ---- keyboard nudge ---- */
await page.click("#btnZoomFit");
await page.waitForTimeout(150);
const zoom = await page.evaluate(() => window.MC.S.zoom);
check("zoom fit applied", zoom > 0.05 && zoom < 2, zoom.toFixed(3));
const xBefore = await page.evaluate(() => window.MC.S.selected().x);
await page.keyboard.press("ArrowRight");
const xAfter = await page.evaluate(() => window.MC.S.selected().x);
check("arrow nudge", xAfter === xBefore + 1, `${xBefore} -> ${xAfter}`);

/* ---- layers panel ---- */
const totalEls = await page.evaluate(() => window.MC.S.page().elements.length);
const layerRows = await page.locator("#layersBody .layer-row").count();
check("layers listed", layerRows === totalEls, `${layerRows}/${totalEls}`);

/* ---- multi-page: apply pitch deck template, then exports ---- */
await page.evaluate(() => {
  const tpl = window.MC.TPL.find((t) => t.id === "tpl-pres");
  window.MC.UI.applyTemplateInDoc(tpl);
});
await page.waitForTimeout(300);
const pageCount = await page.evaluate(() => window.MC.S.doc.pages.length);
check("template pages appended", pageCount >= 6, String(pageCount));

const dl = (fn) => Promise.all([
  page.waitForEvent("download", { timeout: 30000 }).catch(() => null),
  page.evaluate(fn).catch((e) => "ERR:" + e),
]);
let [d1] = await dl(() => window.MC.Export.exportPng(1));
check("PNG download", !!d1 && d1.suggestedFilename().endsWith(".png"), d1 ? d1.suggestedFilename() : "no download");
let [d2] = await dl(() => window.MC.Export.exportSvg());
check("SVG download", !!d2 && d2.suggestedFilename().endsWith(".svg"), d2 ? d2.suggestedFilename() : "no download");
let [d3] = await dl(() => window.MC.Export.exportPdf());
check("PDF download (all pages)", !!d3 && d3.suggestedFilename().endsWith(".pdf"), d3 ? d3.suggestedFilename() : "no download");
if (d3) {
  const p = await d3.path();
  const fs = await import("node:fs");
  const head = fs.readFileSync(p, { encoding: "latin1" }).slice(0, 8);
  check("PDF magic bytes", head.startsWith("%PDF-1.4"), head);
}

/* ---- back to dashboard: design was saved ---- */
await page.click("#btnBack");
await page.waitForTimeout(400);
const cards = await page.locator(".project-card").count();
check("saved design appears on dashboard", cards >= 1, String(cards));

console.log(failures === 0 ? "\nALL BROWSER CHECKS PASS" : `\n${failures} FAILURES`);
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console/page errors");
await browser.close();
process.exit(failures || errors.length ? 1 : 0);
