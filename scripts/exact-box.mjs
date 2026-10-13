import { chromium } from "playwright";
import fs from "fs";

const ref = JSON.parse(fs.readFileSync("evidence/geometry-reference.json", "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1, reducedMotion: "reduce" });
for (const vp of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  await page.setViewportSize(vp);
  await page.goto("http://localhost:5175/", { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "[data-qp-chrome]{display:none!important}" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  const local = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        x: r.x,
        y: r.y + scrollY,
        w: r.width,
        h: r.height,
        font: cs.font,
        smoothing: cs.webkitFontSmoothing,
      };
    };
    return {
      h1: box(".air-hero-section h1"),
      product: box(".air-product-name"),
      header: box("header"),
      img: box(".air-get-section img"),
    };
  });
  const row = ref.find((r) => r.width === vp.width && r.height === vp.height);
  console.log("\n", vp.width);
  console.log("local", JSON.stringify(local, null, 2));
  console.log("ref h1", JSON.stringify(row.measured.heroTitle));
  console.log("ref header", JSON.stringify(row.measured.header && { x: row.measured.header.x, y: row.measured.header.y, w: row.measured.header.w, h: row.measured.header.h }));
}
await browser.close();
