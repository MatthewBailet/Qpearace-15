import fs from "fs";
import path from "path";

const files = [
  "/img/banners-menu-main/bg-air.png",
  "/img/banners-menu-main/bg-air-horizontal.png",
  "/img/banners-menu-main/jb-for-data.svg",
  "/img/banners-menu-main/jb-for-data-horizontal.svg",
];

for (const rel of files) {
  const url = "https://www.jetbrains.com" + rel;
  const dest = path.join("public", rel.slice(1));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    console.log("FAIL", res.status, url);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log("OK", rel, buf.length);
}

const css = fs.readFileSync("public/reference/air.css", "utf8");
const missing = [];
for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
  let u = m[1].trim().replace(/^['"]|['"]$/g, "");
  if (!u.startsWith("/") || u.startsWith("//")) continue;
  u = u.split("?")[0].split("#")[0];
  const file = path.join("public", decodeURIComponent(u.slice(1)));
  if (!fs.existsSync(file)) missing.push(u);
}
console.log("css missing", [...new Set(missing)]);
