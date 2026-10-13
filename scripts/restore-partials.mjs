import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const html = fs.readFileSync("evidence/reference.html", "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "domcontentloaded" });

const split = await page.evaluate(() => {
  const root = document.querySelector(".page-color-default-purple");
  const overview = root.querySelector(":scope > .air-overview");
  const kids = [...root.children].map((el) => ({
    tag: el.tagName,
    id: el.id,
    className: el.className,
  }));
  return {
    kids,
    header: root.querySelector(":scope > header")?.outerHTML ?? "",
    announce: root.querySelector("#announce-placeholder")?.outerHTML ?? "",
    footer: root.querySelector(":scope > footer")?.outerHTML ?? "",
    overviewClass: overview?.className ?? "air-overview",
    sections: [...overview.children].map((el) => ({
      className: el.getAttribute("class") || "",
      html: el.outerHTML,
    })),
  };
});

function rewrite(fragment) {
  return fragment.replace(/href="(\/[^"]*)"/g, (match, href) => {
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
}

const dir = "src/reference/partials";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "header.html"), rewrite(split.header));
fs.writeFileSync(path.join(dir, "announce.html"), rewrite(split.announce));
fs.writeFileSync(path.join(dir, "footer.html"), rewrite(split.footer));

const manifest = {
  overviewClass: split.overviewClass,
  kids: split.kids,
  sections: [],
};
split.sections.forEach((section, i) => {
  const name = `section-${String(i).padStart(2, "0")}`;
  fs.writeFileSync(path.join(dir, `${name}.html`), rewrite(section.html));
  manifest.sections.push({ name, className: section.className, bytes: section.html.length });
});
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
