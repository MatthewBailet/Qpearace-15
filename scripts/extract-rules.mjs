import fs from "fs";

const css = fs.readFileSync("public/reference/air.css", "utf8");

function grab(selector) {
  const idx = css.indexOf(selector);
  if (idx < 0) return "NOT FOUND " + selector;
  return css.slice(idx, idx + 500);
}

const needles = [
  "._wt-container_tbzztj_1{",
  ".page-color-default-purple",
  "--wt-offset-top-unit:",
  "--rs-h1-font-size:",
  "--rs-font-family-jb-sans:",
  "--rs-color-black:",
];
for (const n of needles) {
  console.log("\n## " + n);
  console.log(grab(n));
}

const media = [...css.matchAll(/@media[^{]+\{/g)].map((m) => m[0]);
const counts = new Map();
for (const m of media) counts.set(m, (counts.get(m) || 0) + 1);
console.log("\n## media");
[...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40)
  .forEach(([k, v]) => console.log(v, k));
