import { chromium } from "playwright";
import fs from "fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await page.goto("https://www.jetbrains.com/air/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForSelector(".air-agents-animation");
await page.addStyleTag({
  content: `.ch2,.ch2-container{display:none!important}
.air-agents-animation__item{opacity:0!important;visibility:hidden!important;animation:none!important}
.air-agents-animation__item[data-freeze]{opacity:1!important;visibility:visible!important}`,
});
await page.evaluate(() => {
  const item = [...document.querySelectorAll(".air-agents-animation__item")].find((el) =>
    el.textContent.includes("Junie"),
  );
  item?.setAttribute("data-freeze", "true");
});
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
    window.scrollTo(0, y);
    await sleep(30);
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(300);
const shot = "evidence/screenshots/reference/air-390x844-junie.png";
await page.screenshot({ path: shot, fullPage: true });
const live = PNG.sync.read(fs.readFileSync(shot));
const local = PNG.sync.read(fs.readFileSync("evidence/screenshots/local/air-390x844.png"));
const width = Math.min(live.width, local.width);
const height = Math.min(live.height, local.height);
const diff = new PNG({ width, height });
const a = new PNG({ width, height });
const b = new PNG({ width, height });
PNG.bitblt(live, a, 0, 0, width, height, 0, 0);
PNG.bitblt(local, b, 0, 0, width, height, 0, 0);
const mismatched = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1, includeAA: true });
console.log({
  live: [live.width, live.height],
  local: [local.width, local.height],
  mismatchRatio: Math.round((mismatched / (width * height)) * 100000) / 1000,
});
await browser.close();
