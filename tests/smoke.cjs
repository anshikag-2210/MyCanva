/* Headless smoke test for MyCanvas Studio pure-logic modules (no browser needed). */
"use strict";
const fs = require("fs");
const path = require("path");

// minimal browser stubs
global.window = global;
const fakeCtx = { font: "", measureText: (s) => ({ width: String(s).length * 8 }) };
global.document = {
  createElement: () => ({ style: {}, setAttribute() {}, getContext: () => fakeCtx, addEventListener() {}, appendChild() {}, classList: { add() {}, remove() {} }, querySelector: () => null }),
  createElementNS: () => ({ setAttribute() {}, appendChild() {} }),
  body: { appendChild() {} },
  getElementById: () => null,
};

const dir = path.join(__dirname, "..", "js");
for (const f of ["utils", "elements", "templates", "render", "export"]) {
  (0, eval)(fs.readFileSync(path.join(dir, f + ".js"), "utf8"));
}

let failures = 0;
const check = (name, cond) => {
  console.log((cond ? "PASS" : "FAIL") + "  " + name);
  if (!cond) failures++;
};
const R = global.MC.Render;
const E = global.MC.E;

/* ---- scaleD ---- */
const heart = R.scaleD(E.heartD, 200, 100);
check("scaleD heart scales x by 2", heart.startsWith("M100.00 86.00"));
check("scaleD heart y untouched at h=100", !/ 200(\s|$)/.test(heart));
const ring = R.scaleD(E.ringD, 200, 100);
check("scaleD ring arc radii per-axis", ring.includes("A92.00 46.00 0 1 1 99.98 4.00"));
const star = R.scaleD(E.starD(5, 50, 20), 300, 150);
check("scaleD star starts M", /^M/.test(star));
check("scaleD star x max ~300", star.includes("150 0") || star.includes("150.00 0"));
const conf = R.scaleD(E.confettiD, 120, 80);
check("scaleD confetti keeps Z close", conf.endsWith("Z"));
const zig = R.scaleD(E.zigzagD, 100, 50);
check("scaleD zigzag scales", zig.startsWith("M4 35") || /M4\.0* 35/.test(zig));

/* roundedRect */
check("roundedRect plain rect", R.roundedRect(0, 0, 10, 10, 0) === "M0 0H10V10H0Z");
check("roundedRect clamps r", R.roundedRect(0, 0, 10, 10, 99).includes("A5 5"));

/* ---- templates: build + markup for every template ---- */
for (const tpl of global.MC.TPL) {
  const built = tpl.make();
  let ok = true;
  for (const p of built.pages) {
    const m = R.pageMarkup(p, "smoke");
    if (!m || !m.includes("<defs>")) ok = false;
    for (const el of p.elements) {
      const n = R.elNode(el);
      if (!n.includes("data-el")) ok = false;
    }
  }
  check(`template "${tpl.name}" builds (${built.pages.length} pages)`, ok);
}

/* ---- PDF structure ---- */
const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
const blob = global.MC.Export.makePdf([
  { w: 100, h: 50, data: fakeJpeg },
  { w: 200, h: 100, data: fakeJpeg },
]);
const buf = Buffer.from(blob.size ? blob.toString() : "");
// Blob#toString on undici is useless — re-read via arrayBuffer
(async () => {
  const ab = await blob.arrayBuffer();
  const s = Buffer.from(ab).toString("latin1");
  check("pdf header", s.startsWith("%PDF-1.4"));
  check("pdf eof", s.trimEnd().endsWith("%%EOF"));
  check("pdf page count obj", s.includes("/Count 2"));
  const xrefPos = s.indexOf("xref");
  const startxref = parseInt(s.match(/startxref\n(\d+)/)[1], 10);
  check("pdf startxref points at xref", s.slice(startxref, startxref + 4) === "xref");
  // every object offset in xref must point at "N 0 obj"
  const lines = s.slice(xrefPos).split("\n");
  let offOk = true;
  for (let i = 2; i < lines.length && i < 2 + 8; i++) {
    const m = lines[i].match(/^(\d{10}) 00000 n/);
    if (!m) continue;
    const n = i - 2; // lines[0]="xref", lines[1]="0 N", lines[2]=free obj 0, lines[i]=obj i-2
    const at = parseInt(m[1], 10);
    if (!s.slice(at, at + (" " + n + " 0 obj ").length).includes(n + " 0 obj")) offOk = false;
  }
  check("pdf xref offsets resolve", offOk);

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})();
