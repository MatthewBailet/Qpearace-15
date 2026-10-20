import header from "./partials/header.html?raw";
import footer from "./partials/footer.html?raw";
import { useEffect, useLayoutEffect, useState } from "react";
import { StoriesSection } from "./StoriesSection";
import { HeroBanner, HomeOffer } from "./HeroBanner";
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

const BANNER_LINES = [
  ["Frontier", "all-purpose", "simulation."],
  ["Built", "around", "your", "world."],
] as const;

const BANNER_WORD_DELAYS = [0.14, 0.4, 0.22, 0.48, 0.18, 0.36, 0.28];

const COMPOSER_PROMPTS = [
  "A harbor the morning a storm arrives",
  "A hospital wing during shift change",
  "A downtown block at evening rush",
  "A factory line running at capacity",
  "A neighborhood after heavy rain",
];

function BannerComposer() {
  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (value.trim()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % COMPOSER_PROMPTS.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [value]);

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
        className="qp-composer__input"
        aria-label="Describe where to start"
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="qp-composer__send" type="submit" disabled={!value.trim()} aria-label="Send">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M10.94 5.65a1.5 1.5 0 0 1 2.12 0l4.65 4.65a1 1 0 0 1-1.42 1.41L13 8.41V18a1 1 0 0 1-2 0V8.41L7.71 11.7a1 1 0 0 1-1.42-1.41z"
          />
        </svg>
      </button>
    </form>
  );
}

function BannerTitle() {
  let wordIndex = 0;

  return (
    <h1 className="qp-top-stage__title">
      {BANNER_LINES.map((line) => (
        <span key={line[0]} className="qp-top-stage__line">
          {line.map((word, index) => {
            const delay = BANNER_WORD_DELAYS[wordIndex++];
            return (
              <span key={word}>
                {index > 0 ? " " : null}
                <span className="qp-top-stage__word" style={{ transitionDelay: `${delay}s` }}>
                  {word}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function AirPage() {
  const [bannerIn, setBannerIn] = useState(false);

  useEffect(() => {
    const first = requestAnimationFrame(() => {
      requestAnimationFrame(() => setBannerIn(true));
    });
    return () => cancelAnimationFrame(first);
  }, []);

  useLayoutEffect(() => {
    const header = document.getElementById("wt-site-header");
    const stage = document.querySelector(".qp-top-stage");
    if (!header || !stage) return;

    const update = () => {
      const stageBottom = stage.getBoundingClientRect().bottom;
      const headerBottom = header.getBoundingClientRect().bottom;
      header.classList.toggle("is-past-banner", stageBottom <= headerBottom + 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      header.classList.remove("is-past-banner");
    };
  }, []);

  return (
    <div className="page-color-default-purple">
      <NoticeBar />
      <div className="qp-page-shell">
      <SiteHeader />
      <div className="air-overview">
        <div className="qp-top-stage">
          <div className={`qp-top-stage__inner${bannerIn ? " is-in" : ""}`}>
            <BannerTitle />
            <div className="qp-composer-block">
              <BannerComposer />
            </div>
          </div>
        </div>
        <div className="qp-below-banner">
          <div className="qp-banner-card" aria-hidden="true" />
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
