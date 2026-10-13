# Validation report

Reference: https://www.jetbrains.com/air/
Local: Qpearance Vite app, route `/`, stylesheet `/reference/air.css`
Capture date: 2026-10-09
Compared with Playwright Chromium, device pixel ratio 1, `prefers-reduced-motion: reduce`, scroll 0. The local Reference/Gallery switcher was hidden for screenshots (`[data-qp-chrome] { display: none }`).

## What was directly extracted

- Rendered DOM of `.page-color-default-purple` after fonts loaded and the page was scrolled, with scripts, iframes, and consent UI removed.
- Stylesheets in document order, including the page CSS, layout CSS, grid/type CSS, and the Air demo CSS. Saved as `public/reference/air.css`.
- Font files and images referenced by that CSS and by the DOM, including JetBrains Sans, JetBrains Modul, and Air Web Inter. `document.fonts` reported all three as `loaded` on the live page and again on the local page.
- Media-query thresholds 640, 1000, 1276, and 1540.

## What was measured

Geometry was recorded for the header, announcement, hero, hero title, surface section, cloud section, IDE section, team section, Junie banner, try section, closing section, and footer.

Sample viewports: 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080.
Threshold samples were also measured on the live page: 639/640/641, 999/1000/1001, 1275/1276/1277, 1539/1540/1541.

At 1440×900, measured live values included:

- Header 72px, `#19191c`, width 1425
- Hero title 52px / 400 / 52px, box 600×158 at x 96.5, y 179
- Container max-width 1276px, padding 22px
- Section padding `1px 0 96px`
- Page background `#eeede9`

The same hero box was measured on the local page: x 96.5, y 179, 600×158. At 390×844 both sides measure the hero title at x 16, y 183, 343×98, 32px / 400 / 32px.

## What was verified

Full-page screenshots were compared with pixelmatch (`threshold: 0.1`, anti-aliasing included). Document heights matched exactly at every sample. No recorded box, font size, weight, line-height, color, or padding differed by more than 1 CSS pixel.

| Viewport | Reference size | Local size | Mismatch |
| --- | --- | --- | --- |
| 390×844 | 390×14046 | 390×14046 | 7.517% |
| 768×1024 | 768×12681 | 768×12681 | 0.017% |
| 1024×768 | 1024×12063 | 1024×12063 | 0.020% |
| 1280×800 | 1280×11746 | 1280×11746 | 0.018% |
| 1440×900 | 1440×11794 | 1440×11794 | 0.012% |
| 1920×1080 | 1920×11794 | 1920×11794 | 0.012% |

Difference images: `evidence/screenshots/diff/`.

At 1440 the remaining red pixels sit in the header and announcement text (about 1,900 pixels). That is glyph-edge rasterization, not a layout shift. The hero, cards, and footer boxes match.

An earlier in-browser check at 1173×1106, the same viewport used for the first live inspection, also matched the live document height of 12,270px. Local fonts loaded. No broken images in that check (92 images, 0 broken).

The gallery at `/gallery` renders each captured region in DOM order, plus the token list. It was opened in the browser and the intro, swatches, and region headings were present.

## Remaining mismatches

**390px pixel difference (7.517%).** Section boxes still match. The difference image is spread through text and through the closing photograph. Freezing the live hero on “Junie” (the captured frame) only moved the score from 7.517% to 7.511%, so the agent name is not the cause. The likely cause is small-size glyph rasterization and resampling of the closing artwork (`img` at y 11851.8125, width 713). It does not move section boundaries.

**Hero agent rotation.** The live page swaps Claude Agent, Codex, Junie, Copilot, and OpenCode with JavaScript. The local page keeps the captured Junie frame. The roll-in CSS is present. Reduced motion disables that roll.

**Menus.** Desktop submenus and the mobile menu open by adding classes and `aria-expanded` from JavaScript. The markup is present and collapsed, which matches the captured state. Those panels do not open locally. Radios for the surface selector are exposed as readonly, so IDE / Web / CLI / Mobile do not switch without that script. The captured state is JetBrains IDEs.

**Local chrome.** A fixed Reference / Gallery control sits at the bottom right. It is not part of the Air page and was hidden during comparison.

## Could not be recovered

- The original JavaScript that drives menus, the surface carousel, demo cursors, and the agent-name timer. Copying those application bundles would also pull in analytics. They were left out.
- Consent-banner behavior and copy.
- Anything behind authentication, personalization, or experiments. The page was captured logged out, in English, with the announcement visible.
- Whether a 1px photograph shift at 390 is image decoding or a subpixel layout difference. The section box itself matches.

## Not claimed

This is not a claim that every pixel matches at every width. From 768px through 1920px, structure, type, and boxes match and the screenshot difference is about 0.01–0.02%, concentrated on antialiased header text. At 390px the boxes match and the screenshot difference is larger for the reasons above.
