import fs from "fs";
import path from "path";

const dir = "src/reference/partials";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
const urls = new Set();
for (const f of files) {
  const t = fs.readFileSync(path.join(dir, f), "utf8");
  console.log(f, t.length);
  for (const m of t.matchAll(/url\((?:&quot;|"|')?([^)"']+?)(?:&quot;|"|')?\)/g)) urls.add(m[1]);
  for (const m of t.matchAll(/\s(?:src|href)=["']([^"']+)["']/g)) {
    const u = m[1];
    if (u.startsWith("data:") || u.startsWith("#") || u.startsWith("mailto:") || u.startsWith("javascript:")) continue;
    if (u.startsWith("/") || u.startsWith("http")) urls.add(u);
  }
}
const missing = [];
const ok = [];
for (const u of urls) {
  if (u.startsWith("#") || u.startsWith("data:")) continue;
  let rel = u;
  if (rel.startsWith("http")) {
    missing.push("EXTERNAL " + rel.slice(0, 160));
    continue;
  }
  rel = rel.split("?")[0].split("#")[0];
  if (!rel.startsWith("/")) continue;
  const file = path.join("public", decodeURIComponent(rel.slice(1)));
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) missing.push(rel);
  else ok.push(rel);
}
console.log("ok", ok.length, "missing", missing.length);
missing.slice(0, 80).forEach((m) => console.log("MISS", m));
