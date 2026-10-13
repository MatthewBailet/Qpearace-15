import fs from "node:fs";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

const html = await (await get("https://www.jetbrains.com/")).text();
fs.writeFileSync("evidence/jb-home.html", html);
console.log("html", html.length);

const cssHrefs = [
  ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi),
].map((m) => {
  const href = m[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}).filter(Boolean);

console.log("stylesheets", cssHrefs.length);
cssHrefs.forEach((h) => console.log(h));

const keys = [
  "_hero_d8I6x",
  "_artworkImage_P9ik4",
  "_heroContent_VoRzT",
  "_title_Cs9i5",
  "_wordmark_ypPDs",
  "_subtitle_6joh1",
  "_storyLinkCol_rNr1u",
  "_rs-subtitle-2_dz36gk_1",
  "_light_xhkdfz_6",
  "jb-md-rs-button-size-s",
];

let collected = "";
for (const href of cssHrefs) {
  const url = new URL(href, "https://www.jetbrains.com/").href;
  let css;
  try {
    css = await (await get(url)).text();
  } catch (e) {
    console.log("fail css", url, e.message);
    continue;
  }
  const hits = keys.filter((k) => css.includes(k));
  if (hits.length) {
    console.log("css hits", url, hits.join(","));
    collected += `/* source: ${url} */\n${css}\n`;
  }
}

fs.writeFileSync("evidence/jb-home-hero-css.css", collected);
console.log("collected css", collected.length);

const imgUrl = "https://www.jetbrains.com/_assets/rr/hero-image-wrapper-Cug3ZhGM.webp";
const img = Buffer.from(await (await get(imgUrl)).arrayBuffer());
const dest = path.join("public/_assets/rr/hero-image-wrapper-Cug3ZhGM.webp");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, img);
console.log("image", img.length);
