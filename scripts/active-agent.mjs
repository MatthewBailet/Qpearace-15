import fs from "fs";
const html = fs.readFileSync("src/reference/partials/section-00.html", "utf8");
const re = /air-agents-animation__item[^"]*"[^>]*>[\s\S]*?<\/span>\s*([^<]+)/g;
let m;
let n = 0;
while ((m = re.exec(html)) && n < 20) {
  n++;
  const active = m[0].includes("item_active");
  console.log(active ? "ACTIVE" : "item", m[1].trim().slice(0, 40));
}
