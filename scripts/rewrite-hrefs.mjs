import fs from "fs";
import path from "path";

const dir = "src/reference/partials";
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".html"))) {
  const full = path.join(dir, file);
  let html = fs.readFileSync(full, "utf8");
  html = html.replace(/href="(\/[^"]*)"/g, (match, href) => {
    if (
      href.startsWith("/_assets/") ||
      href.startsWith("/img/") ||
      href.startsWith("/vendor/") ||
      href.startsWith("/reference/")
    ) {
      return match;
    }
    return `href="https://www.jetbrains.com${href}"`;
  });
  fs.writeFileSync(full, html);
  console.log("rewrote", file);
}
