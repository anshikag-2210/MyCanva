import { chromium } from "playwright-core";
const EXE = process.platform === "win32"
  ? String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
  : "/usr/bin/google-chrome";
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("file:///D:/Project/rea/projects/myCanva/index.html");
await page.waitForTimeout(1500);
await page.screenshot({ path: "tests/shot-dashboard.png" });
await page.locator(".tpl-card").nth(2).click(); // pitch deck
await page.waitForTimeout(900);
await page.click('[data-tool="templates"]');
await page.waitForTimeout(300);
await page.screenshot({ path: "tests/shot-editor.png" });
// select an element for the properties panel view
await page.evaluate(() => {
  const e = window.MC.S.page().elements.find((x) => x.type === "text");
  window.MC.UI.selectEl(e.id);
});
await page.waitForTimeout(200);
await page.screenshot({ path: "tests/shot-props.png" });
await browser.close();
console.log("screenshots saved");
