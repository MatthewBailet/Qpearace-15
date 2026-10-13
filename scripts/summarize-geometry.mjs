import fs from "fs";
const geo = JSON.parse(fs.readFileSync("evidence/geometry-reference.json", "utf8"));
const keys = ["header", "announce", "hero", "heroTitle", "heroContainerBox", "surfaces", "cloud", "ides", "features", "junie", "trySection", "getSection", "footer", "featureCard"];
for (const row of geo) {
  if (![390, 768, 1024, 1280, 1440, 1920, 640, 1000, 1276, 1540].includes(row.width)) continue;
  if (![844, 1024, 768, 800, 900, 1080].includes(row.height)) continue;
  const m = row.measured;
  console.log(`\n## ${row.width}x${row.height}`);
  const ht = m.heroTitle;
  if (ht) console.log("H1", ht.fontFamily, ht.fontSize, ht.fontWeight, ht.lineHeight, ht.letterSpacing, ht.color, "box", ht.w, ht.h);
  if (m.heroContainerBox) console.log("container", JSON.stringify(m.heroContainerBox));
  if (m.header) console.log("header", m.header.h, m.header.backgroundColor, "w", m.header.w);
  if (m.overview) console.log("overview bg", m.overview.backgroundColor, "w", m.overview.w);
  for (const k of ["hero", "surfaces", "cloud", "ides", "features", "junie", "trySection", "getSection", "footer"]) {
    const el = m[k];
    if (!el) { console.log(k, "MISSING"); continue; }
    console.log(k, "y", el.y, "h", el.h, "w", el.w, "pad", el.padding, "fs", el.fontSize);
  }
}
