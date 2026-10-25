import header from "./partials/header.html?raw";
import footer from "./partials/footer.html?raw";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { StoriesSection } from "./StoriesSection";
import { FeatureRail } from "./FeatureRail";
import { HeroBanner, HomeOffer, Spotlight } from "./HeroBanner";
import { BannerPresetGallery } from "./BannerPresetGallery";
import { ContinuitySection } from "./ContinuitySection";
import { Highlights } from "./Highlights";
import "./slots.css";

function Slot({ html }: { html: string }) {
  return <div className="qp-slot" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SiteHeader() {
  return <Slot html={header} />;
}

export function HomeHeroSection() {
  return <HeroBanner />;
}

export function SiteFooter() {
  return <Slot html={footer} />;
}

function NoticeBar() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">(() =>
    sessionStorage.getItem("qp-notice") === "closed" ? "gone" : "in",
  );
  if (phase === "gone") return null;

  return (
    <div
      className={`qp-notice${phase === "out" ? " is-out" : ""}`}
      role="region"
      aria-label="Announcement"
      onAnimationEnd={(event) => {
        if (event.animationName === "qp-notice-out") setPhase("gone");
      }}
    >
      <div className="qp-notice__inner">
        <p className="qp-notice__text">
          We’ve updated our ethical data sourcing commitments for 2027.{" "}
          <a href="#sourcing">Read the update</a>
        </p>
        <button
          className="qp-notice__close"
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            sessionStorage.setItem("qp-notice", "closed");
            setPhase("out");
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const BANNER_LINES = [["Start", "building", "frontier", "simulations"]] as const;

const COMPOSER_PROMPTS = [
  "A harbor the morning a storm arrives",
  "A hospital wing during shift change",
  "A downtown block at evening rush",
  "A factory line running at capacity",
  "A neighborhood after heavy rain",
];

const COMPOSER_SCALES = [
  { id: "global", label: "Global" },
  { id: "regional", label: "Regional" },
  { id: "national", label: "National" },
  { id: "virtual", label: "Virtual" },
  { id: "city-local", label: "City & Local" },
  { id: "population", label: "Population" },
  { id: "organization", label: "Organization" },
  { id: "market", label: "Market" },
  { id: "custom", label: "Custom" },
] as const;

function BannerComposer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const scaleListId = useId();
  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState<(typeof COMPOSER_SCALES)[number]["id"]>("global");
  const [scaleOpen, setScaleOpen] = useState(false);
  const selectedScale = COMPOSER_SCALES.find((item) => item.id === scale) ?? COMPOSER_SCALES[0];

  useLayoutEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (value.trim()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % COMPOSER_PROMPTS.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [value]);

  useEffect(() => {
    if (!scaleOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!scaleRef.current?.contains(event.target as Node)) setScaleOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setScaleOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [scaleOpen]);

  return (
    <form className={`qp-composer${value.trim() ? " is-filled" : ""}`} onSubmit={(event) => event.preventDefault()}>
      <div className="qp-composer__ghost" aria-hidden="true">
        <div className="qp-composer__ghost-track" style={{ transform: `translateY(${index * -24}px)` }}>
          {COMPOSER_PROMPTS.map((line, lineIndex) => (
            <div key={line} className={`qp-composer__ghost-line${lineIndex === index ? " is-on" : ""}`}>
              {line}
            </div>
          ))}
        </div>
      </div>
      <textarea
        ref={inputRef}
        className="qp-composer__input"
        aria-label="Describe where to start"
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="qp-composer__scale" ref={scaleRef} data-open={scaleOpen ? "true" : "false"}>
        <button
          className="qp-composer__scale-btn"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={scaleOpen}
          aria-controls={scaleListId}
          aria-label={`Simulation scale: ${selectedScale.label}`}
          onClick={() => setScaleOpen((current) => !current)}
        >
          <svg className="qp-composer__scale-globe" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <ellipse cx="12" cy="12" rx="3.2" ry="8.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M3.9 9.5h16.2M3.9 14.5h16.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <span>{selectedScale.label}</span>
          <svg className="qp-composer__scale-chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M4.2 6.2 8 10l3.8-3.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ul
          className="qp-composer__scale-menu"
          id={scaleListId}
          role="listbox"
          aria-label="Simulation scale"
          aria-hidden={!scaleOpen}
          inert={!scaleOpen}
        >
          {COMPOSER_SCALES.map((item) => (
            <li key={item.id} role="presentation">
              <button
                className="qp-composer__scale-option"
                type="button"
                role="option"
                tabIndex={scaleOpen ? 0 : -1}
                aria-selected={scale === item.id}
                onClick={() => {
                  setScale(item.id);
                  setScaleOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button className="qp-composer__send" type="submit" disabled={!value.trim()} aria-label="Send">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 18V6M7 11l5-5 5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}

function BannerTitle() {
  return (
    <h1 className="qp-top-stage__title">
      {BANNER_LINES.map((line) => (
        <span key={line[0]} className="qp-top-stage__line qp-top-stage__line--display">
          {line.map((word, index) => (
            <span key={word}>
              {index > 0 ? " " : null}
              <span className="qp-top-stage__word">{word}</span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

export function AirPage() {
  useLayoutEffect(() => {
    const header = document.getElementById("wt-site-header");
    if (!header || !document.querySelector(".qp-top-stage")) return;

    const update = () => {
      const stage = document.querySelector(".qp-top-stage");
      const pastBanner = !!stage && stage.getBoundingClientRect().bottom <= header.offsetHeight + 1;
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      header.classList.toggle("is-past-banner", pastBanner);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      header.classList.remove("is-scrolled", "is-past-banner");
    };
  }, []);

  return (
    <div className="page-color-default-purple">
      <NoticeBar />
      <div className="qp-page-shell">
      <SiteHeader />
      <div className="air-overview">
        <div className="qp-top-stage">
          <div className="qp-banner-sky" aria-hidden="true" />
          <div className="qp-top-stage__inner">
            <div className="qp-top-stage__hero-cluster">
              <div className="qp-top-stage__copy">
                <BannerTitle />
              </div>
              <div className="qp-composer-block">
                <BannerComposer />
              </div>
            </div>
            <BannerPresetGallery />
          </div>
        </div>
        <div className="qp-below-banner">
          <ContinuitySection />
          <Highlights />
          <Spotlight />
          <FeatureRail />
          <HomeHeroSection />
          <StoriesSection />
          <HomeOffer />
        </div>
      </div>
      <SiteFooter />
      </div>
    </div>
  );
}
