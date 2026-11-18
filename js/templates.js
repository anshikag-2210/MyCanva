/* MyCanvas Studio — original template definitions (all content & layouts authored here). */
(function () {
  "use strict";
  const U = () => window.MC.U;
  const E = () => window.MC.E;

  /* helpers ---------------------------------------------------------- */
  const page = (w, h, name, bg) => ({ id: U().uid("pg"), name: name || "Page", w, h, bg: bg || { type: "color", color: "#ffffff" }, elements: [] });
  const txt = (t, x, y, w, o) => Object.assign(E().text(t, o), { x, y, w });
  const shp = (k, x, y, w, h, o) => Object.assign(E().shape(k, o), { x, y, w, h: h == null ? (o && o.h) || (o ? o.h : w) : h });
  const gph = (k, x, y, w, h, o) => Object.assign(E().graphic(k, o), { x, y, w, h });
  const grad = (c1, c2, angle) => ({ type: "gradient", c1, c2, angle: angle == null ? 45 : angle });

  /* each template returns {name, pages:[...]} ------------------------- */
  const T = [];

  T.push({
    id: "tpl-ig-quote", name: "Quote Post", cat: "social", w: 1080, h: 1080,
    make() {
      const p = page(1080, 1080, "Quote", grad("#4f46e5", "#0ea5e9", 135));
      p.elements.push(
        gph("dots", 60, 70, 180, 180, { fill: "#ffffff", opacity: 0.35 }),
        gph("ring", 760, 780, 260, 260, { fill: "#ffffff", opacity: 0.25 }),
        txt("“Simplicity is the ultimate sophistication.”", 130, 380, 820, { size: 64, weight: 700, color: "#ffffff", align: "center", lh: 1.35 }),
        shp("line", 440, 640, 200, 8, { fill: "#f59e0b" }),
        txt("— your name here", 340, 690, 400, { size: 30, color: "#e5e7eb", align: "center", weight: 500, ls: 3 }),
        txt("@yourbrand", 390, 940, 300, { size: 22, color: "#c7d2fe", align: "center", ls: 4 }),
      );
      return { name: "Quote Post", pages: [p] };
    },
  });

  T.push({
    id: "tpl-story", name: "Story Splash", cat: "social", w: 1080, h: 1920,
    make() {
      const p = page(1080, 1920, "Story", grad("#0f172a", "#4f46e5", 180));
      p.elements.push(
        gph("burst", 60, 120, 240, 240, { fill: "#f59e0b", opacity: 0.9 }),
        gph("wave", 0, 1560, 1080, 360, { fill: "#0ea5e9", opacity: 0.85 }),
        txt("NEW DROP", 140, 560, 800, { size: 34, weight: 600, color: "#f59e0b", align: "center", ls: 12 }),
        txt("Something big is\ncoming this week", 120, 640, 840, { size: 96, weight: 800, color: "#ffffff", align: "center", lh: 1.15 }),
        shp("round", 290, 1160, 500, 120, { fill: "#ffffff", radius: 60 }),
        txt("Swipe up to see more", 290, 1190, 500, { size: 34, weight: 700, color: "#1f2430", align: "center" }),
        txt("tonight • 8pm", 240, 1330, 600, { size: 28, color: "#cbd5e1", align: "center", ls: 4 }),
      );
      return { name: "Story Splash", pages: [p] };
    },
  });

  T.push({
    id: "tpl-pres", name: "Pitch Deck", cat: "presentation", w: 1920, h: 1080,
    make() {
      const c = { dark: "#111827", accent: "#4f46e5", amber: "#f59e0b", ink: "#1f2430", soft: "#6b7280" };
      const pages = [];
      // 1 — title
      let p = page(1920, 1080, "Title", { type: "color", color: c.dark });
      p.elements.push(
        shp("rect", 0, 0, 16, 1080, { fill: c.accent }),
        gph("ring", 1380, 140, 420, 420, { fill: c.accent, opacity: 0.35 }),
        gph("dots", 1500, 700, 260, 260, { fill: c.amber, opacity: 0.5 }),
        txt("A clear idea,\nwell told.", 220, 330, 1200, { size: 110, weight: 800, color: "#ffffff", lh: 1.12 }),
        txt("A short pitch for your next big thing", 230, 640, 900, { size: 40, color: "#9ca3af" }),
        txt("Prepared by You  •  2026", 230, 900, 700, { size: 26, color: "#6b7280", ls: 3 }),
      );
      pages.push(p);
      // 2 — agenda
      p = page(1920, 1080, "Agenda", { type: "color", color: "#ffffff" });
      p.elements.push(
        txt("What we'll cover", 160, 110, 900, { size: 64, weight: 800, color: c.ink }),
        shp("rect", 160, 220, 120, 10, { fill: c.amber }),
      );
      ["The problem", "Our approach", "Early results", "The ask"].forEach((t, i) => {
        p.elements.push(
          shp("circle", 170, 340 + i * 150, 64, 64, { fill: i === 0 ? c.accent : "#e5e7eb" }),
          txt(String(i + 1), 170, 352 + i * 150, 64, { size: 30, weight: 700, color: i === 0 ? "#fff" : c.ink, align: "center" }),
          txt(t, 290, 352 + i * 150, 1100, { size: 40, weight: 500, color: c.ink }),
        );
      });
      pages.push(p);
      // 3 — stat
      p = page(1920, 1080, "Results", { type: "color", color: "#ffffff" });
      p.elements.push(
        txt("Early results", 160, 100, 900, { size: 56, weight: 800, color: c.ink }),
        shp("round", 160, 240, 760, 420, { fill: "#eef2ff", radius: 40 }),
        txt("3.2×", 160, 300, 760, { size: 170, weight: 800, color: c.accent, align: "center" }),
        txt("faster onboarding after the redesign", 160, 540, 760, { size: 32, color: c.soft, align: "center" }),
        shp("round", 1010, 240, 760, 420, { fill: "#fef3c7", radius: 40 }),
        txt("92%", 1010, 300, 760, { size: 170, weight: 800, color: "#b45309", align: "center" }),
        txt("of users said they'd recommend it", 1010, 540, 760, { size: 32, color: c.soft, align: "center" }),
        txt("Numbers are placeholders — swap in your own metrics.", 160, 760, 1200, { size: 26, italic: true, color: c.soft }),
      );
      pages.push(p);
      // 4 — quote
      p = page(1920, 1080, "Quote", grad(c.accent, "#0ea5e9", 120));
      p.elements.push(
        gph("ring", 1450, 640, 360, 360, { fill: "#ffffff", opacity: 0.18 }),
        txt("“Exactly the tool our team needed.”", 240, 380, 1440, { size: 84, weight: 700, color: "#ffffff", align: "center", lh: 1.3 }),
        txt("A happy customer", 240, 660, 1440, { size: 32, color: "#e0e7ff", align: "center", ls: 4 }),
      );
      pages.push(p);
      // 5 — thanks
      p = page(1920, 1080, "Thanks", { type: "color", color: c.dark });
      p.elements.push(
        shp("rect", 0, 0, 16, 1080, { fill: c.amber }),
        txt("Thank you.", 360, 400, 1200, { size: 120, weight: 800, color: "#ffffff", align: "center" }),
        txt("hello@yourbrand.com   •   @yourbrand", 360, 620, 1200, { size: 30, color: "#9ca3af", align: "center" }),
      );
      pages.push(p);
      return { name: "Pitch Deck", pages };
    },
  });

  T.push({
    id: "tpl-yt", name: "YouTube Thumbnail", cat: "video", w: 1280, h: 720,
    make() {
      const p = page(1280, 720, "Thumbnail", grad("#7c3aed", "#db2777", 90));
      p.elements.push(
        gph("burst", 880, 90, 330, 330, { fill: "#f59e0b" }),
        gph("confetti", 90, 430, 240, 240, { fill: "#ffffff", opacity: 0.8 }),
        shp("arrow", 620, 300, 260, 130, { fill: "#ffffff" }),
        txt("I tried this for 30 days", 110, 180, 760, { size: 84, weight: 800, color: "#ffffff", lh: 1.08 }),
        shp("round", 110, 430, 560, 130, { fill: "#111827", radius: 24 }),
        txt("and here's what happened", 110, 462, 560, { size: 40, weight: 700, color: "#fbbf24", align: "center" }),
      );
      return { name: "YouTube Thumbnail", pages: [p] };
    },
  });

  T.push({
    id: "tpl-resume", name: "Resume", cat: "career", w: 1240, h: 1754,
    make() {
      const p = page(1240, 1754, "Page 1", { type: "color", color: "#ffffff" });
      const accent = "#0f766e", ink = "#1f2937", soft = "#6b7280";
      p.elements.push(
        shp("rect", 0, 0, 1240, 330, { fill: accent }),
        shp("circle", 90, 75, 180, 180, { fill: "#ffffff", opacity: 0.18 }),
        txt("Your Name", 90, 90, 700, { size: 76, weight: 800, color: "#ffffff" }),
        txt("Product Designer  •  yourcity.com", 90, 195, 700, { size: 28, color: "#ccfbf1", ls: 2 }),
        txt("yournn@gmail.com  •  +1 555 0100", 90, 245, 700, { size: 24, color: "#99f6e4" }),
      );
      sec("Experience", 90, 430);
      p.elements.push(
        txt("Senior Product Designer", 90, 500, 700, { size: 34, weight: 700, color: ink }),
        txt("Acme Corp  •  2023 — present", 700, 505, 450, { size: 24, color: soft, align: "right" }),
        txt("Led the redesign of the core editor, raising task completion 30% and cutting onboarding time in half.", 90, 555, 1060, { size: 25, color: soft, lh: 1.4 }),
        txt("Built the design system used by four product teams; documented 60+ components.", 90, 655, 1060, { size: 25, color: soft, lh: 1.4 }),
      );
      sec("Projects", 90, 790);
      p.elements.push(
        txt("OpenStudio", 90, 860, 500, { size: 32, weight: 700, color: ink }),
        txt("2022", 900, 865, 250, { size: 24, color: soft, align: "right" }),
        txt("An open design collaboration space with 12k monthly users; designed from zero to launch.", 90, 915, 1060, { size: 25, color: soft, lh: 1.4 }),
      );
      sec("Education", 90, 1050);
      p.elements.push(
        txt("B.Des, Interaction Design", 90, 1120, 700, { size: 30, weight: 600, color: ink }),
        txt("State University  •  2016 — 2020", 700, 1125, 450, { size: 24, color: soft, align: "right" }),
      );
      sec("Skills", 90, 1250);
      p.elements.push(
        txt("Product design  •  Design systems  •  Prototyping  •  User research\nFigma  •  HTML/CSS  •  Motion  •  Accessibility", 90, 1320, 1060, { size: 26, color: ink, lh: 1.5 }),
      );
      function sec(t, x, y) {
        p.elements.push(
          txt(t, x, y, 600, { size: 34, weight: 800, color: accent, ls: 2 }),
          shp("line", x, y + 52, 1060, 4, { fill: "#e5e7eb" }),
        );
      }
      return { name: "Resume", pages: [p] };
    },
  });

  T.push({
    id: "tpl-poster", name: "Event Poster", cat: "print", w: 1000, h: 1400,
    make() {
      const p = page(1000, 1400, "Poster", { type: "color", color: "#0f172a" });
      p.elements.push(
        gph("dots", 640, 90, 300, 300, { fill: "#334155" }),
        gph("wave", 0, 1150, 1000, 250, { fill: "#4f46e5" }),
        gph("ring", 60, 1150, 300, 300, { fill: "#f59e0b", opacity: 0.9 }),
        txt("SUMMER", 100, 220, 800, { size: 130, weight: 800, color: "#f59e0b", ls: 8 }),
        txt("MUSIC\nFESTIVAL", 100, 360, 800, { size: 130, weight: 800, color: "#ffffff", lh: 1.05 }),
        shp("line", 100, 720, 300, 8, { fill: "#f59e0b" }),
        txt("July 18 — 20  •  Riverside Park", 100, 780, 800, { size: 34, weight: 600, color: "#e2e8f0" }),
        txt("Three stages. Forty artists. One long weekend.\nDoors open at 3pm. All ages welcome.", 100, 850, 780, { size: 27, color: "#94a3b8", lh: 1.5 }),
        shp("round", 100, 1190, 420, 110, { fill: "#f59e0b", radius: 55 }),
        txt("Tickets: festival.example", 100, 1225, 420, { size: 26, weight: 700, color: "#111827", align: "center" }),
      );
      return { name: "Event Poster", pages: [p] };
    },
  });

  T.push({
    id: "tpl-card", name: "Business Card", cat: "print", w: 1050, h: 600,
    make() {
      const front = page(1050, 600, "Front", grad("#111827", "#312e81", 120));
      front.elements.push(
        shp("rect", 0, 560, 1050, 40, { fill: "#f59e0b" }),
        gph("ring", 780, 90, 220, 220, { fill: "#ffffff", opacity: 0.12 }),
        txt("Your Name", 80, 180, 700, { size: 62, weight: 700, color: "#ffffff" }),
        txt("CREATIVE DIRECTOR", 82, 270, 700, { size: 26, color: "#a5b4fc", ls: 6 }),
        txt("hello@yourbrand.com", 82, 420, 600, { size: 24, color: "#e5e7eb" }),
        txt("+1 555 0100", 82, 462, 600, { size: 24, color: "#e5e7eb" }),
        txt("yourbrand.example", 82, 504, 600, { size: 24, color: "#e5e7eb" }),
      );
      const back = page(1050, 600, "Back", { type: "color", color: "#ffffff" });
      back.elements.push(
        shp("rect", 0, 0, 24, 600, { fill: "#f59e0b" }),
        shp("rect", 380, 170, 290, 290, { fill: "#4f46e5" }),
        shp("circle", 430, 220, 190, 190, { fill: "#6366f1" }),
        txt("yb", 380, 255, 290, { size: 110, weight: 800, color: "#ffffff", align: "center" }),
        txt("yourbrand.example", 380, 495, 290, { size: 20, color: "#6b7280", align: "center", ls: 2 }),
      );
      return { name: "Business Card", pages: [front, back] };
    },
  });

  T.push({
    id: "tpl-menu", name: "Café Menu", cat: "print", w: 1000, h: 1400,
    make() {
      const p = page(1000, 1400, "Menu", { type: "color", color: "#fdf6ec" });
      const ink = "#3f3a33", soft = "#8a8177", accent = "#9a3412";
      p.elements.push(
        shp("rect", 60, 60, 880, 1280, { fill: "none", stroke: "#d6c7ae", sw: 3, radius: 0 }),
        txt("Café Sol", 120, 150, 760, { size: 84, weight: 800, color: ink, align: "center", font: "Georgia" }),
        txt("SMALL BATCH  •  BAKED DAILY", 120, 265, 760, { size: 22, color: accent, align: "center", ls: 6 }),
        shp("line", 380, 330, 240, 4, { fill: "#d6c7ae" }),
      );
      item("Espresso", "3.0", 120, 420);
      item("Filter coffee", "3.5", 120, 500);
      item("Flat white", "4.5", 120, 580);
      item("Cold brew", "4.0", 120, 660);
      p.elements.push(
        txt("— BAKERY —", 120, 780, 760, { size: 26, weight: 700, color: accent, align: "center", ls: 4 }),
      );
      item("Butter croissant", "4.0", 120, 860);
      item("Sourdough toast", "5.0", 120, 940);
      item("Cardamom bun", "4.5", 120, 1020);
      p.elements.push(
        txt("Prices include tax. Ask about today's specials.", 120, 1200, 760, { size: 20, italic: true, color: soft, align: "center", font: "Georgia" }),
      );
      function item(name, price, x, y) {
        p.elements.push(
          txt(name, x, y, 560, { size: 30, weight: 600, color: ink, font: "Georgia" }),
          txt(price, 680, y, 200, { size: 30, weight: 600, color: accent, align: "right", font: "Georgia" }),
        );
      }
      return { name: "Café Menu", pages: [p] };
    },
  });

  T.push({
    id: "tpl-banner", name: "Web Banner", cat: "web", w: 1500, h: 500,
    make() {
      const p = page(1500, 500, "Banner", grad("#0ea5e9", "#4f46e5", 90));
      p.elements.push(
        gph("dots", 1150, 60, 280, 280, { fill: "#ffffff", opacity: 0.25 }),
        gph("ring", 1180, 240, 240, 240, { fill: "#ffffff", opacity: 0.3 }),
        txt("Spring sale — up to 40% off", 100, 140, 900, { size: 66, weight: 800, color: "#ffffff", lh: 1.15 }),
        txt("Ends Sunday. Use code SPRING40 at checkout.", 100, 290, 800, { size: 28, color: "#e0f2fe" }),
        shp("round", 100, 360, 300, 84, { fill: "#ffffff", radius: 42 }),
        txt("Shop now", 100, 382, 300, { size: 30, weight: 700, color: "#4f46e5", align: "center" }),
      );
      return { name: "Web Banner", pages: [p] };
    },
  });

  T.push({
    id: "tpl-invite", name: "Invitation", cat: "print", w: 1080, h: 1350,
    make() {
      const p = page(1080, 1350, "Invite", { type: "color", color: "#fbf7f0" });
      const ink = "#44403c", soft = "#a8a29e", accent = "#b45309";
      p.elements.push(
        shp("rect", 70, 70, 940, 1210, { fill: "none", stroke: "#d6cdbf", sw: 2 }),
        gph("ring", 440, 140, 200, 200, { fill: "none", stroke: accent, sw: 3 }),
        txt("You're invited", 140, 420, 800, { size: 78, weight: 700, color: ink, align: "center", font: "Georgia", italic: true }),
        txt("A garden dinner on Saturday, June 20th at seven o'clock.", 170, 570, 740, { size: 30, color: soft, align: "center", font: "Georgia", lh: 1.5 }),
        shp("line", 440, 700, 200, 3, { fill: accent }),
        txt("THE GARDEN PAVILION  •  12 MAPLE LANE", 170, 770, 740, { size: 22, color: ink, align: "center", ls: 5 }),
        txt("Please reply by June 10th  •  RSVP to +1 555 0100", 170, 850, 740, { size: 22, color: soft, align: "center" }),
        gph("confetti", 120, 1050, 180, 180, { fill: accent, opacity: 0.5 }),
        gph("dots", 780, 1060, 180, 180, { fill: "#d6cdbf" }),
      );
      return { name: "Invitation", pages: [p] };
    },
  });

  T.push({
    id: "tpl-blank", name: "Blank Canvas", cat: "blank", w: 1240, h: 1754,
    make() { return { name: "Blank Canvas", pages: [page(1240, 1754, "Page 1")] }; },
  });

  window.MC = window.MC || {};
  window.MC.TPL = T;
})();
