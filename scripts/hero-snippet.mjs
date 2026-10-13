import fs from "fs";
const html = fs.readFileSync("src/reference/partials/section-00.html", "utf8");
const i = html.indexOf("agents you already");
console.log(html.slice(i, i + 1800));
