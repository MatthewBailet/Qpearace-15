import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import "../design-system/media-card-gallery.css";
import type { CaptionPlacement } from "../design-system/MediaCardGallery";

type Preset = {
  id: string;
  label: string;
  caption: string;
  visual: string;
  placement: CaptionPlacement;
  compact?: CaptionPlacement;
};

const PRESETS: Preset[] = [
  {
    id: "global",
    label: "Global",
    visual: "global",
    placement: { edge: "top", align: "start" },
    caption:
      "Consider all the factors that make a planet move as one world—climate, trade, and policy, linked so every region starts from the same live baseline.",
  },
  {
    id: "regional",
    label: "Regional",
    visual: "regional",
    placement: { edge: "top", align: "center" },
    caption:
      "Compare continents and corridors side by side—aligned timelines and boundaries keep cross-border decisions honest.",
  },
  {
    id: "national",
    label: "National",
    visual: "national",
    placement: { edge: "center", align: "start" },
    caption:
      "Stress-test country-wide plans with institutions, infrastructure, and population tied to authoritative borders and calendars.",
  },
  {
    id: "virtual",
    label: "Virtual",
    visual: "virtual",
    placement: { edge: "top", align: "end" },
    caption:
      "Prototype digital twins and synthetic venues on the same simulation core—then carry what you learn back to the physical world.",
  },
  {
    id: "city-local",
    label: "City & Local",
    visual: "city",
    placement: { edge: "bottom", align: "start" },
    compact: { edge: "top", align: "start" },
    caption:
      "See districts, utilities, and daily movement at street resolution—rehearse interventions where people actually live.",
  },
  {
    id: "population",
    label: "Population",
    visual: "population",
    placement: { edge: "center", align: "center" },
    caption:
      "Start from demographics and behavior, then watch how groups respond as incentives, norms, and shocks evolve together.",
  },
  {
    id: "organization",
    label: "Organization",
    visual: "organization",
    placement: { edge: "bottom", align: "end" },
    compact: { edge: "top", align: "end" },
    caption:
      "Mirror teams, supply chains, and approvals inside a firm or agency to practice coordination before it counts.",
  },
  {
    id: "market",
    label: "Market",
    visual: "market",
    placement: { edge: "bottom", align: "center" },
    compact: { edge: "top", align: "center" },
    caption:
      "Model buyers, sellers, and pricing feedback loops to trace how volatility moves through demand, inventory, and competition.",
  },
  {
    id: "custom",
    label: "Custom",
    visual: "custom",
    placement: { edge: "center", align: "end" },
    caption:
      "Bring your geometry, rules, and datasets—compose a world that matches your domain without rebuilding the engine.",
  },
];

function tabScrollPadding(scroller: HTMLElement) {
  return Number.parseFloat(getComputedStyle(scroller).scrollPaddingInline) || 0;
}

export function BannerPresetGallery() {
  const baseId = useId();
  const tablistRef = useRef<HTMLUListElement>(null);
  const tabnavRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paddleLeft, setPaddleLeft] = useState(false);
  const [paddleRight, setPaddleRight] = useState(false);

  const syncPaddles = useCallback(() => {
    const scroller = tablistRef.current;
    if (!scroller) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    if (max <= 2) {
      setPaddleLeft(false);
      setPaddleRight(false);
      return;
    }
    setPaddleLeft(scroller.scrollLeft > 2);
    setPaddleRight(scroller.scrollLeft < max - 2);
  }, []);

  const scrollTabIntoView = useCallback(
    (next: number) => {
      const scroller = tablistRef.current;
      const tab = scroller?.querySelector<HTMLElement>(`[data-preset-tab="${next}"]`);
      if (!scroller || !tab) return;
      const pad = tabScrollPadding(scroller);
      const target = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, target - pad * 0.5), behavior: "smooth" });
    },
    [],
  );

  const select = useCallback(
    (next: number) => {
      const clamped = (next + PRESETS.length) % PRESETS.length;
      setIndex(clamped);
      scrollTabIntoView(clamped);
    },
    [scrollTabIntoView],
  );

  useEffect(() => {
    const scroller = tablistRef.current;
    if (!scroller) return;
    syncPaddles();
    scroller.addEventListener("scroll", syncPaddles, { passive: true });
    const ro = new ResizeObserver(syncPaddles);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", syncPaddles);
      ro.disconnect();
    };
  }, [syncPaddles]);

  useEffect(() => {
    scrollTabIntoView(index);
  }, [index, scrollTabIntoView]);

  const nudgeTabs = (direction: -1 | 1) => {
    const scroller = tablistRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * Math.max(180, scroller.clientWidth * 0.55), behavior: "smooth" });
  };

  const stepCard = (direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= PRESETS.length) return;
    select(next);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLAnchorElement>, tabIndex: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      select(tabIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(tabIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(PRESETS.length - 1);
    }
  };

  const onTabClick = (event: MouseEvent<HTMLAnchorElement>, tabIndex: number) => {
    event.preventDefault();
    select(tabIndex);
  };

  return (
    <section
      className="qp-preset-gallery"
      aria-label="Simulation presets"
      data-analytics-gallery-id="preset gallery"
    >
      <div className="qp-preset-gallery__tablist-wrapper">
        <div
          className={`qp-preset-tabnav${paddleLeft || paddleRight ? " is-overflowing" : ""}`}
          ref={tabnavRef}
        >
          <ul
            ref={tablistRef}
            className="qp-preset-tabnav__items"
            role="tablist"
            aria-label="Preset categories"
          >
            {PRESETS.map((preset, tabIndex) => {
              const selected = tabIndex === index;
              const tabId = `${baseId}-${preset.id}-tab`;
              const panelId = `${baseId}-${preset.id}-panel`;
              return (
                <li key={preset.id} className="qp-preset-tabnav__item" role="presentation">
                  <a
                    href={`#${panelId}`}
                    id={tabId}
                    className={`qp-preset-tabnav__link${selected ? " is-current" : ""}`}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    data-preset-tab={tabIndex}
                    onClick={(event) => onTabClick(event, tabIndex)}
                    onKeyDown={(event) => onTabKeyDown(event, tabIndex)}
                  >
                    <span>{preset.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="qp-preset-tabnav__paddles" aria-hidden="true">
            <button
              type="button"
              className="qp-preset-tabnav__paddle qp-preset-tabnav__paddle--left"
              tabIndex={-1}
              disabled={!paddleLeft}
              onClick={() => nudgeTabs(-1)}
            >
              <svg viewBox="0 0 9 18" aria-hidden="true">
                <path
                  d="M7.25 1.75 1.5 9l5.75 7.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="qp-preset-tabnav__paddle qp-preset-tabnav__paddle--right"
              tabIndex={-1}
              disabled={!paddleRight}
              onClick={() => nudgeTabs(1)}
            >
              <svg viewBox="0 0 9 18" aria-hidden="true">
                <path
                  d="M1.75 1.75 7.5 9l-5.75 7.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="qp-preset-gallery__items">
        {PRESETS.map((preset, panelIndex) => {
          const selected = panelIndex === index;
          const tabId = `${baseId}-${preset.id}-tab`;
          const panelId = `${baseId}-${preset.id}-panel`;
          return (
            <div
              key={preset.id}
              id={panelId}
              className={`qp-preset-gallery__item${selected ? " is-current" : ""}`}
              data-tone="dark"
              role="tabpanel"
              aria-labelledby={tabId}
              aria-hidden={!selected}
            >
              <article className="qp-gallery__card">
                <div
                  className={`qp-gallery__media qp-preset-gallery__media qp-preset-gallery__media--${preset.visual}`}
                  role="img"
                  aria-label={`${preset.label} simulation preview`}
                />
                <div
                  className="qp-gallery__caption"
                  data-edge={preset.placement.edge ?? "top"}
                  data-align={preset.placement.align ?? "center"}
                  data-compact-edge={preset.compact?.edge}
                  data-compact-align={preset.compact?.align}
                >
                  <div className="qp-gallery__caption-copy">
                    <p className="qp-gallery__headline">{preset.caption}</p>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
      <div className="qp-preset-gallery__nav">
        <button
          type="button"
          className="qp-preset-gallery__nav-btn"
          aria-label="Previous preset"
          disabled={index === 0}
          onClick={() => stepCard(-1)}
        >
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <path d="m20 25c-.3838 0-.7676-.1465-1.0605-.4395l-5.5-5.5c-.5859-.5854-.5859-1.5356 0-2.1211l5.5-5.5c.5859-.5859 1.5352-.5859 2.1211 0 .5859.5854.5859 1.5356 0 2.1211l-4.4395 4.4395 4.4395 4.4395c.5859.5854.5859 1.5356 0 2.1211-.293.293-.6768.4395-1.0605.4395z" />
          </svg>
        </button>
        <button
          type="button"
          className="qp-preset-gallery__nav-btn"
          aria-label="Next preset"
          disabled={index === PRESETS.length - 1}
          onClick={() => stepCard(1)}
        >
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <path d="m22.5597 16.9375-5.5076-5.5c-.5854-.5854-1.5323-.5825-2.1157.0039-.5835.5869-.5815 1.5366.0039 2.1211l4.4438 4.4375-4.4438 4.4375c-.5854.5845-.5874 1.5342-.0039 2.1211.2922.2944.676.4414 1.0598.4414.3818 0 .7637-.1455 1.0559-.4375l5.5076-5.5c.2815-.2812.4403-.6636.4403-1.0625s-.1588-.7812-.4403-1.0625z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
