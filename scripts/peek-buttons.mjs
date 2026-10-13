import fs from "fs";
const css = fs.readFileSync("public/reference/air.css", "utf8");
const i = css.indexOf("--rs-text-3-font-size");
console.log(css.slice(i, i + 180));
const j = css.indexOf("._sizeM_xhkdfz_26 [data-rs-internal=button__content]");
console.log("\nM content", j, css.slice(j, j + 350));
