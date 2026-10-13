# Air page design specification

Source: https://www.jetbrains.com/air/
Captured: 2026-10-09T18:51:38.401Z
Browser for extraction: Playwright Chromium, device pixel ratio 1, locale en-US, `prefers-reduced-motion: reduce`, scroll position 0.
Consent: the Cookiebot-style banner was in the DOM and hidden for capture. It is not part of the Air page.
Labels below are **directly extracted** (from delivered CSS or the rendered DOM), **measured** (computed style or bounding box), or **inferred**.

This specification covers only what this page and its observable states show. It is not the whole JetBrains system.

## Page shell

| Token | Value | Label |
| --- | --- | --- |
| Page background | `#eeede9` / `rgb(238, 237, 233)` | Measured on `.air-overview` |
| Header background | `#19191c` | Directly extracted `--rs-color-black` and `--wt-site-header-bg` |
| Hard text | `#19191c` / `rgb(25, 25, 28)` | Measured on the hero `h1` |
| Page primary | `#6b57ff` | Directly extracted `.page-color-default-purple --rs-color-primary-light-theme` |
| Card border | `#dddbcf` | Directly extracted on IDE, feature, governance, and try cards |
| Feature card fill | `#e6e4db` | Directly extracted `.air-feature-card` |
| Cloud banner fill | `#e5e4d9`, border `#dddbce` | Directly extracted `.air-cloud-agents-banner` |
| Card radius | `8px` | Directly extracted |

## Typography

Loaded and confirmed `document.fonts` status `loaded`:

- **JetBrains Sans**, variable `100–900`, plus static 300, 400, and 600. Body and UI. Directly extracted `@font-face`, and measured as the computed family on the hero `h1`.
- **JetBrains Modul**, variable `1–900`, used by `.air-product-name` and `html[lang=en] .air-font-jb-modul` at weight 250. Directly extracted. File served by the page: `JetBrains_Modul-C6AYqW67.woff2` (5,856 bytes).
- **Air Web Inter**, variable `100–900`. Directly extracted for `.air-demo-surface.air-web-demo` at 13px, weight 480, line-height 16px, letter-spacing `0.004em`.

Hero `h1` (`.air-section-title`), measured:

- Above 640px: JetBrains Sans, 52px, weight 400, line-height 52px, letter-spacing `normal`, color `rgb(25, 25, 28)`.
- At 390 and 640: 32px / 32px / 400.

The 52px / 100% line-height rule is directly extracted: `.air-overview .air-section-title`. The 32px override is the same rule inside `@media (width <= 640px)`.

The words “jetbrains air” sit in `.air-product-name`, which switches the family to JetBrains Modul. The `h1` itself still computes to JetBrains Sans.

## Layout

Breakpoints are `width <=` queries, counted in the extracted stylesheet:

- 640px: 164 rules
- 1000px: 65 rules
- 1276px: 46 rules
- 1540px: 7 rules

Container `._wt-container_tbzztj_1`, directly extracted:

- Default: `width: 100%`, `max-width: 1276px`, `margin-inline: auto`, padding `22px`
- `width <= 1276px`: `max-width: 996px`, padding `22px`
- `width <= 1000px`: `max-width: 100%`, padding `22px`
- `width <= 640px`: `max-width: 100%`, padding `16px`

Measured hero container at 1440×900: width 1276, x 96.5 (centered in a 1425px layout width; 15px is the scrollbar). At 390×844: width 375, x 0, padding `0 16px`.

Section padding, directly extracted and measured:

- `padding-top: 1px`
- `padding-bottom: calc(var(--wt-offset-top-unit) * 4)`
- `--wt-offset-top-unit` is 24px, and 16px at `width <= 640px`
- Measured: `1px 0 96px` above 640, `1px 0 64px` at 640 and 390

Header, directly extracted:

- Height 72px (`--wt-site-header-height`)
- Height 48px at `width <= 1000px` (`--wt-mobile-site-header-height`)
- Measured 72px at 1024 and above, 48px at 1000 and below

Columns use the 12-column `wt-col` rules with `flex-basis: calc(100% * var(--wt-col-count) / 12 - gutter…)`. Those formulas are kept in the extracted CSS. They were not snapped to a new spacing scale.

## Sections in DOM order

1. `header#wt-site-header` — global navigation
2. `#announce-placeholder` — announcement bar
3. `.air-hero-section` — hero
4. `.air-surfaces-section` — IDE / Web / CLI / Mobile selector and previews
5. `.air-cloud-agents-section` — “Switch screens without a second thought”
6. `.air-in-ides-section` — developer features
7. `.air-features-section` — team features
8. `.air-adopt-ai-section` — governance
9. `.air-junie-banner-section` — Junie banner
10. `.air-adopt-ai-section` — context
11. `.air-try-section` — access cards
12. `.air-get-section` — closing artwork
13. `footer`

## Motion

Directly extracted:

- Hero agent names: `.air-agents-animation`. Items stack in one grid cell. The active item fades and translates 16px over 0.5s, `cubic-bezier(.4,0,.2,1)`. `prefers-reduced-motion: reduce` removes that animation. Which item is active is set in JavaScript. The captured frame is **Junie**. The other names in the DOM are Claude Agent, Codex, Copilot, and OpenCode.
- Demo cursor: `.air-web-cursor` / `.air-proto-cursor`, transform `0.65s cubic-bezier(.4,0,.2,1)`.
- Reduced-motion rules: 3 `@media (prefers-reduced-motion: reduce)` blocks in the extracted CSS.

## What was not copied

Analytics, tag managers, and the consent banner stylesheet were not copied. Their absence is intentional.
