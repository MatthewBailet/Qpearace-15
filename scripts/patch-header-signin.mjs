import fs from "node:fs";

const path = "src/reference/partials/header.html";
const h = fs.readFileSync(path, "utf8");
const marker = 'data-test="site-header-profile-action"';
const start = h.lastIndexOf("<a ", h.indexOf(marker));
if (start < 0) throw new Error("profile start not found");

let i = start;
let depth = 0;
let end = -1;
while (i < h.length) {
  if (h.startsWith("<a ", i) || h.startsWith("<a>", i)) depth += 1;
  else if (h.startsWith("</a>", i)) {
    depth -= 1;
    if (depth === 0) {
      end = i + 4;
      break;
    }
  }
  i += 1;
}
if (end < 0) throw new Error("profile end not found");

const replacement =
  '<a data-test="site-header-profile-action" aria-label="Try Qpearance" type="button" href="#sign-in" class="_main_xhkdfz_62 _modeRock_xhkdfz_36 _sizeS_xhkdfz_23 _alignIconLeft_xhkdfz_49 _dark_xhkdfz_9 _action_z4o2dh_10 qp-signin-btn"><span class="_content_xhkdfz_207" data-rs-internal="button__content" data-test="button__content">Try Qpearance</span><svg class="qp-btn-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.2 3.2 11 8 6.2 12.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';

fs.writeFileSync(path, h.slice(0, start) + replacement + h.slice(end));
console.log("replaced", end - start, "chars");
