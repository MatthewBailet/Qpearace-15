import fs from "fs";
const css = fs.readFileSync("public/reference/air.css", "utf8");
for (const k of [
  "._rs-h2_dz36gk_1{",
  "._rs-h3_dz36gk_1{",
  "._rs-h4_dz36gk_1{",
  "._rs-h5_dz36gk_1{",
  "._rs-text-1_dz36gk_1{",
  "._rs-text-2_dz36gk_1{",
  "._rs-text-3_dz36gk_1{",
]) {
  const i = css.indexOf(k);
  const chunk = css.slice(i, i + 900);
  const size = chunk.match(/font-size:[^;]+/);
  const lh = chunk.match(/--_rs-typography-font-size:[^;]+/);
  const ls = chunk.match(/--_rs-typography-letter-spacing:[^;]+/);
  const line = chunk.match(/--_rs-typography-line-height:[^;]+/);
  const w = chunk.match(/--_rs-typography-font-weight:[^;]+/);
  console.log(k, { size, lh, ls, line, w });
}
