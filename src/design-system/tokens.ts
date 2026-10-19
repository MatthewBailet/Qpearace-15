export type TokenSource = "directly-extracted" | "measured";

export type AirToken = {
  name: string;
  value: string;
  source: TokenSource;
  note: string;
};

/** Tokens evidenced on https://www.jetbrains.com/air/ on 2026-10-09. */
export const airTokens: AirToken[] = [
  {
    name: "page-background",
    value: "#eeede9",
    source: "measured",
    note: "Computed background of .air-overview. rgb(238, 237, 233).",
  },
  {
    name: "header-background",
    value: "#19191c",
    source: "directly-extracted",
    note: "--wt-site-header-bg and --rs-color-black.",
  },
  {
    name: "text-hard",
    value: "#19191c",
    source: "measured",
    note: "Hero h1 computed color rgb(25, 25, 28).",
  },
  {
    name: "page-primary",
    value: "#6b57ff",
    source: "directly-extracted",
    note: ".page-color-default-purple --rs-color-primary-light-theme.",
  },
  {
    name: "card-border",
    value: "#dddbcf",
    source: "directly-extracted",
    note: ".air-in-ides-card, .air-feature-card, .air-adopt-ai-card, .air-try-card border.",
  },
  {
    name: "feature-card-fill",
    value: "#e6e4db",
    source: "directly-extracted",
    note: ".air-feature-card background-color.",
  },
  {
    name: "cloud-banner-fill",
    value: "#e5e4d9",
    source: "directly-extracted",
    note: ".air-cloud-agents-banner background-color. Border #dddbce.",
  },
  {
    name: "font-ui",
    value: "Qpearance Sans",
    source: "measured",
    note: "OFL derivative of Instrument Sans with round i/j tittles. Optical retune: lowercase rungs ×1.07, Instrument tracking curve. Inter remains on .air-demo-surface.",
  },
  {
    name: "font-display",
    value: "JetBrains Modul",
    source: "directly-extracted",
    note: ".air-product-name and html[lang=en] .air-font-jb-modul. Weight 250. File JetBrains_Modul-C6AYqW67.woff2.",
  },
  {
    name: "font-demo",
    value: "Air Web Inter",
    source: "directly-extracted",
    note: "Loaded as Inter.var-Cq-YLKBW.woff2. Used by .air-demo-surface.air-web-demo at 13px / 480 / 16px.",
  },
  {
    name: "section-title",
    value: "52px / 52px / 400",
    source: "measured",
    note: "Hero h1 above 640px. .air-overview .air-section-title sets 52px and line-height 100%. At width<=640px the same rule sets 32px. Measured 32px/32px/400 at 390 and 640.",
  },
  {
    name: "header-height",
    value: "72px",
    source: "directly-extracted",
    note: "--wt-site-header-height. Becomes --wt-mobile-site-header-height 48px at width<=1000px. Measured 72 above 1000 and 48 at 1000 and below.",
  },
  {
    name: "container",
    value: "max-width 1276px; padding 0 22px",
    source: "directly-extracted",
    note: "._wt-container. max-width 996px at width<=1276px. max-width 100% at width<=1000px. padding 16px at width<=640px.",
  },
  {
    name: "section-padding-bottom",
    value: "calc(var(--wt-offset-top-unit) * 4)",
    source: "directly-extracted",
    note: "--wt-offset-top-unit is 24px, 16px at width<=640px. Measured padding 1px 0 96px above 640 and 1px 0 64px at 640 and 390. Top padding stays 1px.",
  },
  {
    name: "spacing-scale",
    value: "8 / 16 / 24 / 32 / 40 / 48 / 56 / 64 / 72 / 80 / 96 / 112 / 128",
    source: "directly-extracted",
    note: "8px scale. --qp-space-n. --qp-gutter-s 16 sibling cards, --qp-gutter 24 module/column, --qp-gutter-m 32 loose groups, --qp-inset 22/16 page edge, --wt-offset-top-unit 24/16 section unit.",
  },
  {
    name: "radius-card",
    value: "8px",
    source: "directly-extracted",
    note: "Feature, IDE, governance, try, and Junie surfaces.",
  },
  {
    name: "button-ink",
    value: "#26241f",
    source: "measured",
    note: "Dark sand fill for buttons — one step deeper than #2e2c27, still the umber of #e6e4db / #eeede9 rather than cool #19191c. Label #faf9f5.",
  },
  {
    name: "radius-button",
    value: "12px",
    source: "measured",
    note: "Button corners. 12px squircle on ~40px height: softer than 8px, still a rectangle not a pill.",
  },
  {
    name: "breakpoints",
    value: "640, 1000, 1276, 1540",
    source: "directly-extracted",
    note: "Media features are width<=px, not min-width. Counts in air.css: 164, 65, 46, and 7 rules.",
  },
];
