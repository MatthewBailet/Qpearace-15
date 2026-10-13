import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const base = process.env.COMPARE_URL || "http://localhost:5175/";
const shots = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const outDir = path.join("evidence", "screenshots", "local");
const diffDir = path.join("evidence", "screenshots", "diff");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(diffDir, { recursive: true });

const reference = JSON.parse(fs.readFileSync("evidence/geometry-reference.json", "utf8"));

function numDelta(a, b) {
  if (typeof a !== "number" || typeof b !== "number") return null;
  return Math.round((a - b) * 100) / 100;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "en-US",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const report = [];

for (const vp of shots) {
  await page.setViewportSize(vp);
  await page.goto(base, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "[data-qp-chrome]{display:none !important}" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += 800) {
      window.scrollTo(0, y);
      await sleep(40);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);

  const localShot = path.join(outDir, `air-${vp.width}x${vp.height}.png`);
  await page.screenshot({ path: localShot, fullPage: true });

  const refShot = path.join("evidence", "screenshots", "reference", `air-${vp.width}x${vp.height}.png`);
  const localPng = PNG.sync.read(fs.readFileSync(localShot));
  const refPng = PNG.sync.read(fs.readFileSync(refShot));
  const width = Math.min(localPng.width, refPng.width);
  const height = Math.min(localPng.height, refPng.height);
  const diff = new PNG({ width, height });

  function crop(src) {
    if (src.width === width && src.height === height) return src.data;
    const out = new PNG({ width, height });
    PNG.bitblt(src, out, 0, 0, width, height, 0, 0);
    return out.data;
  }

  const mismatched = pixelmatch(crop(refPng), crop(localPng), diff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });
  const diffPath = path.join(diffDir, `air-${vp.width}x${vp.height}.png`);
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  const measured = await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const keys = {
      header: "header#wt-site-header",
      hero: ".air-hero-section",
      heroTitle: ".air-hero-section h1",
      surfaces: ".air-surfaces-section",
      cloud: ".air-cloud-agents-section",
      ides: ".air-in-ides-section",
      features: ".air-features-section",
      junie: ".air-junie-banner",
      trySection: ".air-try-section",
      getSection: ".air-get-section",
      footer: "footer",
    };
    const out = {};
    for (const [key, sel] of Object.entries(keys)) {
      const el = q(sel);
      if (!el) {
        out[key] = null;
        continue;
      }
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out[key] = {
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        x: Math.round(r.x * 100) / 100,
        y: Math.round((r.y + scrollY) * 100) / 100,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        fontFamily: cs.fontFamily,
        color: cs.color,
        padding: cs.padding,
      };
    }
    const c = q(".air-hero-section [class*='_wt-container_']");
    if (c) {
      const r = c.getBoundingClientRect();
      out.heroContainerBox = {
        w: Math.round(r.width * 100) / 100,
        x: Math.round(r.x * 100) / 100,
        maxWidth: getComputedStyle(c).maxWidth,
        padding: getComputedStyle(c).padding,
      };
    }
    out.docH = document.documentElement.scrollHeight;
    return out;
  });

  const refRow = reference.find((row) => row.width === vp.width && row.height === vp.height);
  const geometry = [];
  if (refRow) {
    for (const key of Object.keys(measured)) {
      const a = refRow.measured[key];
      const b = measured[key];
      if (!a || !b || typeof a !== "object") continue;
      const fields = ["w", "h", "x", "y"];
      const deltas = {};
      for (const field of fields) {
        const d = numDelta(b[field], a[field]);
        if (d !== null && Math.abs(d) > 1) deltas[field] = { reference: a[field], local: b[field], delta: d };
      }
      for (const field of ["fontSize", "fontWeight", "lineHeight", "color", "padding"]) {
        if (a[field] && b[field] && a[field] !== b[field]) {
          deltas[field] = { reference: a[field], local: b[field] };
        }
      }
      if (Object.keys(deltas).length) geometry.push({ key, deltas });
    }
    if (Math.abs(measured.docH - (refRow.measured.overview ? refRow.measured.footer.y + refRow.measured.footer.h : 0)) > 1) {
      geometry.push({
        key: "document",
        deltas: {
          docH: {
            local: measured.docH,
            referenceFooterEnd: refRow.measured.footer ? refRow.measured.footer.y + refRow.measured.footer.h : null,
          },
        },
      });
    }
  }

  const pixels = width * height;
  report.push({
    viewport: vp,
    referenceSize: { w: refPng.width, h: refPng.height },
    localSize: { w: localPng.width, h: localPng.height },
    compared: { w: width, h: height },
    mismatched,
    mismatchRatio: Math.round((mismatched / pixels) * 100000) / 1000,
    geometry,
  });
  console.log(
    vp.width,
    "mismatch",
    report.at(-1).mismatchRatio + "%",
    "size",
    refPng.width + "x" + refPng.height,
    "vs",
    localPng.width + "x" + localPng.height,
    "geom",
    geometry.length,
  );
}

fs.writeFileSync("evidence/comparison.json", JSON.stringify(report, null, 2));
await browser.close();
