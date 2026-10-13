import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const root = process.cwd();
const evidence = path.join(root, "evidence");
const publicDir = path.join(root, "public");
const shotDir = path.join(evidence, "screenshots", "reference");
fs.mkdirSync(shotDir, { recursive: true });
fs.mkdirSync(path.join(evidence, "styles"), { recursive: true });

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 639, height: 900 },
  { width: 640, height: 900 },
  { width: 641, height: 900 },
  { width: 768, height: 1024 },
  { width: 999, height: 900 },
  { width: 1000, height: 900 },
  { width: 1001, height: 900 },
  { width: 1024, height: 768 },
  { width: 1275, height: 900 },
  { width: 1276, height: 900 },
  { width: 1277, height: 900 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1539, height: 900 },
  { width: 1540, height: 900 },
  { width: 1541, height: 900 },
  { width: 1920, height: 1080 },
];

const FULL_SHOTS = new Set([390, 768, 1024, 1280, 1440, 1920]);

function localPathFor(absUrl) {
  const u = new URL(absUrl, "https://www.jetbrains.com");
  if (u.hostname === "www.jetbrains.com" || u.hostname === "jetbrains.com") {
    return u.pathname + (u.search || "");
  }
  if (u.hostname === "resources.jetbrains.com") {
    return "/vendor/resources.jetbrains.com" + u.pathname;
  }
  return null;
}

function rewriteUrl(raw) {
  if (!raw || raw.startsWith("data:") || raw.startsWith("#") || raw.startsWith("blob:")) return raw;
  try {
    const abs = new URL(raw, "https://www.jetbrains.com").href;
    const local = localPathFor(abs);
    return local || raw;
  } catch {
    return raw;
  }
}

function collectUrls(text, base) {
  const found = new Set();
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[2].trim();
    if (!raw || raw.startsWith("data:")) continue;
    try {
      found.add(new URL(raw, base).href);
    } catch {
      /* ignore */
    }
  }
  return found;
}

async function downloadAll(request, urls) {
  const saved = [];
  const failed = [];
  const list = [...urls];
  const queue = list.filter((u) => localPathFor(u));
  let i = 0;
  async function worker() {
    while (i < queue.length) {
      const url = queue[i++];
      const rel = localPathFor(url).split("?")[0];
      const dest = path.join(publicDir, decodeURIComponent(rel.replace(/^\//, "")));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        saved.push({ url, rel, bytes: fs.statSync(dest).size, cached: true });
        continue;
      }
      try {
        const res = await request.get(url, { timeout: 60000 });
        if (!res.ok()) {
          failed.push({ url, status: res.status() });
          continue;
        }
        const buf = await res.body();
        fs.writeFileSync(dest, buf);
        saved.push({ url, rel, bytes: buf.length });
      } catch (err) {
        failed.push({ url, error: String(err).slice(0, 240) });
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  return { saved, failed, skippedExternal: list.filter((u) => !localPathFor(u)) };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "en-US",
  reducedMotion: "reduce",
});
const page = await context.newPage();
await page.goto("https://www.jetbrains.com/air/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForSelector(".air-overview", { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);

// Consent overlay is not part of the Air page design. Hide it for capture.
await page.addStyleTag({
  content: ".ch2,.ch2-container,.ch2-region-g0{display:none !important}",
});

await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const height = document.documentElement.scrollHeight;
  for (let y = 0; y < height; y += 500) {
    window.scrollTo(0, y);
    await sleep(80);
  }
  window.scrollTo(0, 0);
  await sleep(200);
});
await page.evaluate(() => document.fonts.ready);

const capture = await page.evaluate(() => {
  const pageRoot = document.querySelector(".page-color-default-purple");
  const clone = pageRoot.cloneNode(true);
  clone.querySelectorAll("script,iframe,noscript").forEach((n) => n.remove());

  const sections = [...clone.querySelectorAll(":scope > .air-overview > *")].map((el, i) => ({
    i,
    tag: el.tagName.toLowerCase(),
    className: el.getAttribute("class") || "",
    id: el.id || "",
    heading: (el.querySelector("h1,h2")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180),
  }));

  const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
  const inline = [...document.querySelectorAll("style")].map((s, i) => ({
    i,
    text: s.textContent || "",
  }));

  const fonts = [];
  document.fonts.forEach((f) => {
    fonts.push({ family: f.family, weight: f.weight, style: f.style, status: f.status });
  });

  return {
    html: clone.outerHTML,
    sections,
    sheets,
    inline,
    fonts,
    title: document.title,
    lang: document.documentElement.lang,
  };
});

const assetUrls = new Set();
for (const href of capture.sheets) {
  if (href.includes("cookie-banner")) continue;
  assetUrls.add(href);
}
for (const block of capture.inline) {
  for (const u of collectUrls(block.text, "https://www.jetbrains.com/air/")) assetUrls.add(u);
}
for (const u of collectUrls(capture.html, "https://www.jetbrains.com/air/")) assetUrls.add(u);
const attrRe = /\s(?:src|poster|data-src)=["']([^"']+)["']/g;
let am;
while ((am = attrRe.exec(capture.html))) {
  try {
    assetUrls.add(new URL(am[1], "https://www.jetbrains.com/air/").href);
  } catch {
    /* ignore */
  }
}
const srcsetRe = /\ssrcset=["']([^"']+)["']/g;
while ((am = srcsetRe.exec(capture.html))) {
  for (const part of am[1].split(",")) {
    const url = part.trim().split(/\s+/)[0];
    if (!url) continue;
    try {
      assetUrls.add(new URL(url, "https://www.jetbrains.com/air/").href);
    } catch {
      /* ignore */
    }
  }
}

function rewriteCss(css, base) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (full, q, raw) => {
    const quote = q || "";
    try {
      const abs = new URL(raw.trim(), base).href;
      const local = localPathFor(abs);
      if (!local) return full;
      return `url(${quote}${local.split("?")[0]}${quote})`;
    } catch {
      return full;
    }
  });
}

let html = capture.html.replace(
  /(https?:)?\/\/www\.jetbrains\.com(?=\/)/g,
  "",
);
html = html.replace(
  /https?:\/\/resources\.jetbrains\.com([^"' )\s]+)/g,
  (_, p) => `/vendor/resources.jetbrains.com${p}`,
);

const cssParts = [];
const sheetMeta = [];
for (const href of capture.sheets) {
  if (href.includes("cookie-banner")) {
    sheetMeta.push({ href, skipped: "consent banner stylesheet" });
    continue;
  }
  const res = await page.request.get(href);
  const text = await res.text();
  for (const u of collectUrls(text, href)) assetUrls.add(u);
  const rewritten = rewriteCss(text, href);
  const name = path.basename(new URL(href).pathname);
  fs.writeFileSync(path.join(evidence, "styles", name), rewritten);
  cssParts.push(`/* source: ${href} */\n${rewritten}`);
  sheetMeta.push({ href, name, bytes: rewritten.length, status: res.status() });
}

const inlineKept = [];
capture.inline.forEach((block) => {
  if (!block.text.trim()) return;
  if (block.text.includes("ch2-") || block.text.includes("cookie")) return;
  const rewritten = rewriteCss(block.text, "https://www.jetbrains.com/air/");
  inlineKept.push(rewritten);
  cssParts.push(`/* inline style ${block.i} */\n${rewritten}`);
});

fs.mkdirSync(path.join(publicDir, "reference"), { recursive: true });
fs.writeFileSync(path.join(publicDir, "reference", "air.css"), cssParts.join("\n\n"));
fs.writeFileSync(path.join(evidence, "reference.html"), html);

const download = await downloadAll(page.request, assetUrls);

const sectionDir = path.join(root, "src", "reference", "partials");
fs.mkdirSync(sectionDir, { recursive: true });
const split = await page.evaluate(() => {
  const rootEl = document.querySelector(".page-color-default-purple");
  const header = rootEl.querySelector(":scope > header");
  const announce = rootEl.querySelector("#announce-placeholder");
  const overview = rootEl.querySelector(":scope > .air-overview");
  const footer = rootEl.querySelector(":scope > footer");
  const pieces = {};
  if (header) pieces.header = header.outerHTML;
  if (announce) pieces.announce = announce.outerHTML;
  if (footer) pieces.footer = footer.outerHTML;
  pieces.sections = [...overview.children].map((el) => ({
    className: el.getAttribute("class") || "",
    html: el.outerHTML,
  }));
  pieces.overviewClass = overview.getAttribute("class") || "";
  pieces.pageClass = rootEl.getAttribute("class") || "";
  return pieces;
});

function rewriteHtml(fragment) {
  return fragment
    .replace(/(https?:)?\/\/www\.jetbrains\.com(?=\/)/g, "")
    .replace(/https?:\/\/resources\.jetbrains\.com([^"' )\s]+)/g, (_, p) => `/vendor/resources.jetbrains.com${p}`);
}

const manifest = {
  pageClass: split.pageClass,
  overviewClass: split.overviewClass,
  partials: [],
};
fs.writeFileSync(path.join(sectionDir, "header.html"), rewriteHtml(split.header || ""));
fs.writeFileSync(path.join(sectionDir, "announce.html"), rewriteHtml(split.announce || ""));
fs.writeFileSync(path.join(sectionDir, "footer.html"), rewriteHtml(split.footer || ""));
manifest.partials.push("header", "announce", "footer");
split.sections.forEach((section, i) => {
  const name = `section-${String(i).padStart(2, "0")}`;
  fs.writeFileSync(path.join(sectionDir, `${name}.html`), rewriteHtml(section.html));
  manifest.partials.push(name);
  manifest[name] = section.className;
});
fs.writeFileSync(path.join(sectionDir, "manifest.json"), JSON.stringify(manifest, null, 2));

function pick(el) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    w: Math.round(r.width * 100) / 100,
    h: Math.round(r.height * 100) / 100,
    x: Math.round(r.x * 100) / 100,
    y: Math.round((r.y + scrollY) * 100) / 100,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    padding: cs.padding,
    margin: cs.margin,
    maxWidth: cs.maxWidth,
    display: cs.display,
    gap: cs.gap,
    borderRadius: cs.borderRadius,
    text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
  };
}

const geometry = [];
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
  const measured = await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const many = (sel) => [...document.querySelectorAll(sel)].slice(0, 4);
    const selectors = {
      header: "header#wt-site-header",
      announce: "#announce-placeholder",
      overview: ".air-overview",
      hero: ".air-hero-section",
      heroTitle: ".air-hero-section h1",
      heroContainer: ".air-hero-section ._wt-container_tbzztj_1, .air-hero-section [class*='_wt-container_']",
      surfaces: ".air-surfaces-section",
      surfacesNav: ".air-surfaces-navigation",
      cloud: ".air-cloud-agents-section",
      ides: ".air-in-ides-section",
      features: ".air-features-section",
      adopt: ".air-adopt-ai-section",
      junie: ".air-junie-banner",
      context: ".air-overview > .air-adopt-ai-section + .air-adopt-ai-section, .air-codebase-section",
      trySection: ".air-try-section",
      getSection: ".air-get-section",
      footer: "footer",
      featureCard: ".air-feature-card",
      idesCard: ".air-in-ides-card",
      tryCard: ".air-try-card",
    };
    const out = {};
    for (const [key, sel] of Object.entries(selectors)) {
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
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        padding: cs.padding,
        margin: cs.margin,
        maxWidth: cs.maxWidth,
        widthStyle: cs.width,
        display: cs.display,
        gap: cs.gap,
        borderRadius: cs.borderRadius,
      };
    }
    out.heroTitleText = q(".air-hero-section h1")?.innerText || "";
    out.containerCount = document.querySelectorAll("[class*='_wt-container_']").length;
    const c = q(".air-hero-section [class*='_wt-container_']");
    if (c) {
      const cs = getComputedStyle(c);
      const r = c.getBoundingClientRect();
      out.heroContainerBox = {
        w: Math.round(r.width * 100) / 100,
        x: Math.round(r.x * 100) / 100,
        padding: cs.padding,
        maxWidth: cs.maxWidth,
      };
    }
    out.featureCardCount = document.querySelectorAll(".air-feature-card").length;
    out.navItemCount = document.querySelectorAll(".air-surfaces-navigation__item, [class*='air-surfaces-navigation'] button, [class*='air-surfaces-navigation'] label").length;
    return out;
  });
  geometry.push({ ...vp, measured });
  if (FULL_SHOTS.has(vp.width) && vp.height !== 900 && vp.width !== 1000) {
    await page.screenshot({
      path: path.join(shotDir, `air-${vp.width}x${vp.height}.png`),
      fullPage: true,
    });
  }
}

// Always shoot the six primary samples even if height collided with a threshold pass.
for (const vp of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  await page.setViewportSize(vp);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo(0, 0));
  const file = path.join(shotDir, `air-${vp.width}x${vp.height}.png`);
  if (!fs.existsSync(file)) {
    await page.screenshot({ path: file, fullPage: true });
  }
}

const meta = {
  url: "https://www.jetbrains.com/air/",
  capturedAt: new Date().toISOString(),
  browser: "Playwright Chromium",
  devicePixelRatio: 1,
  reducedMotion: "reduce",
  consent: "Cookie banner hidden for capture. It is a consent overlay, not Air page content.",
  scrollPosition: 0,
  locale: "en-US",
  title: capture.title,
  lang: capture.lang,
  fonts: capture.fonts,
  sections: capture.sections,
  sheets: sheetMeta,
  inlineStyleBlocks: inlineKept.length,
  assetsSaved: download.saved.length,
  assetsFailed: download.failed,
  externalSkipped: download.skippedExternal.slice(0, 40),
  label: "Directly extracted from the live rendered page and its stylesheets.",
};

fs.writeFileSync(path.join(evidence, "capture-meta.json"), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(evidence, "geometry-reference.json"), JSON.stringify(geometry, null, 2));
fs.writeFileSync(
  path.join(evidence, "asset-manifest.json"),
  JSON.stringify({ saved: download.saved.length, failed: download.failed }, null, 2),
);

console.log(JSON.stringify({
  htmlBytes: html.length,
  sections: capture.sections.length,
  sheets: sheetMeta.length,
  assets: download.saved.length,
  failed: download.failed.length,
  fonts: capture.fonts,
}, null, 2));

await browser.close();
