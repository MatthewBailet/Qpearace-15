import { useCallback, useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    id: "world",
    title: "World sims",
    copy: "Cities, campuses, weather, crowds, and the infrastructure around them. Run a place as a live environment, not a frozen scene.",
  },
  {
    id: "web",
    title: "Web sims",
    copy: "Sites, sessions, and digital traffic as a running environment. See how people move through pages, products, and flows.",
  },
  {
    id: "commerce",
    title: "Commerce sims",
    copy: "Stores, catalogs, demand, and checkout in one model. Keep inventory, pricing, and traffic current as the market moves.",
  },
  {
    id: "operations",
    title: "Operations sims",
    copy: "Plants, warehouses, hospitals, and shift-change floors. Simulate the work inside a facility as conditions change.",
  },
  {
    id: "mobility",
    title: "Mobility sims",
    copy: "Roads, fleets, ports, and transit. Run movement through a network without freezing the rest of the world.",
  },
  {
    id: "markets",
    title: "Market sims",
    copy: "Capital, risk, and trading conditions as a live environment—so plans stay aligned with what the market is actually doing.",
  },
] as const;

function FeatureScene({ id }: { id: (typeof FEATURES)[number]["id"] }) {
  return (
    <div className={`qp-use-rail__scene qp-use-rail__scene--${id}`} aria-hidden="true">
      <span className="qp-use-rail__scene-a" />
      <span className="qp-use-rail__scene-b" />
      <span className="qp-use-rail__scene-c" />
      <span className="qp-use-rail__scene-d" />
    </div>
  );
}

export function FeatureRail() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    setAtStart(scroller.scrollLeft <= 8);
    setAtEnd(max <= 8 || scroller.scrollLeft >= max - 8);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    const card = scroller?.querySelector<HTMLElement>(".qp-use-rail__card");
    if (!scroller || !card) return;
    const styles = getComputedStyle(scroller);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
    scroller.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <section className="qp-use-rail" aria-label="Simulation types">
      <div className="qp-use-rail__intro">
        <h2 className="qp-use-rail__title">World sims, web sims, and everything in between.</h2>
      </div>
      <div className="qp-use-rail__controls">
        <button
          className="qp-use-rail__nav"
          type="button"
          aria-label="Previous feature"
          disabled={atStart}
          onClick={() => step(-1)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M12.5 4.5 7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="qp-use-rail__nav"
          type="button"
          aria-label="Next feature"
          disabled={atEnd}
          onClick={() => step(1)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M7.5 4.5 13 10l-5.5 5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="qp-use-rail__scroller" ref={scrollerRef}>
        {FEATURES.map((feature) => (
          <article key={feature.id} className="qp-use-rail__card">
            <div className="qp-use-rail__copy">
              <h3 className="qp-use-rail__name">{feature.title}</h3>
              <p className="qp-use-rail__desc">{feature.copy}</p>
            </div>
            <FeatureScene id={feature.id} />
          </article>
        ))}
      </div>
    </section>
  );
}
