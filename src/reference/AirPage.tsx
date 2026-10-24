import header from "./partials/header.html?raw";
import footer from "./partials/footer.html?raw";
import { useEffect, useLayoutEffect, useState } from "react";
import { StoriesSection } from "./StoriesSection";
import { FeatureRail } from "./FeatureRail";
import { HeroBanner, HomeOffer, Spotlight } from "./HeroBanner";
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

const BANNER_WORDS = ["Experience", "frontier,", "all-purpose", "simulations"] as const;

const BANNER_MOBILE_BREAK_AFTER = new Set(["frontier,"]);

const BANNER_WORD_DELAYS = [0.26, 0.14, 0.4, 0.22];

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
      <span className="qp-top-stage__line qp-top-stage__line--display">
        {BANNER_WORDS.map((word, index) => (
          <span key={word}>
            {index > 0 ? " " : null}
            <span className="qp-top-stage__word" style={{ transitionDelay: `${BANNER_WORD_DELAYS[index]}s` }}>
              {word}
            </span>
            {BANNER_MOBILE_BREAK_AFTER.has(word) ? <br className="qp-top-stage__br" /> : null}
          </span>
        ))}
      </span>
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
        <div className={`qp-top-stage${bannerIn ? " is-in" : ""}`}>
          <div className="qp-banner-sky" aria-hidden="true" />
          <div className={`qp-top-stage__inner${bannerIn ? " is-in" : ""}`}>
            <div className="qp-top-stage__copy">
              <BannerTitle />
            </div>
            <div className="qp-composer-block">
              <BannerComposer />
            </div>
          </div>
        </div>
        <div className="qp-below-banner">
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
