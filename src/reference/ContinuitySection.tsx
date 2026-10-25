import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import "./continuity.css";

type Panel = {
  id: string;
  label: string;
};

const panels: Panel[] = [
  { id: "studio", label: "Studio" },
  { id: "agents", label: "Agents" },
  { id: "feeds", label: "Feeds" },
  { id: "review", label: "Review" },
  { id: "api", label: "API" },
];

function Chevron() {
  return (
    <svg viewBox="0 0 10 17" aria-hidden="true">
      <path
        d="M1.8 1.6 8.2 8.5 1.8 15.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaddleIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M7.25 1.75 1.5 9l5.75 7.25" : "M1.75 1.75 7.5 9l-5.75 7.25";
  return (
    <svg viewBox="0 0 9 18" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ContinuitySection() {
  const baseId = useId();
  const tablistRef = useRef<HTMLUListElement>(null);
  const platterRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paddleLeft, setPaddleLeft] = useState(false);
  const [paddleRight, setPaddleRight] = useState(false);
  const [indicator, setIndicator] = useState({ x: 4, width: 0 });

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

  const scrollTabIntoView = useCallback((next: number) => {
    const scroller = tablistRef.current;
    const tab = scroller?.querySelector<HTMLElement>(`[data-continuity-tab="${next}"]`);
    if (!scroller || !tab) return;
    const target = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, []);

  const select = useCallback(
    (next: number) => {
      const clamped = (next + panels.length) % panels.length;
      setIndex(clamped);
      scrollTabIntoView(clamped);
    },
    [scrollTabIntoView],
  );

  const syncIndicator = useCallback(() => {
    const platter = platterRef.current;
    const tab = tablistRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!platter || !tab) return;
    const platterRect = platter.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    setIndicator({
      x: tabRect.left - platterRect.left,
      width: tabRect.width,
    });
  }, []);

  useEffect(() => {
    const scroller = tablistRef.current;
    if (!scroller) return;
    const sync = () => {
      syncPaddles();
      syncIndicator();
    };
    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [syncIndicator, syncPaddles]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [index, syncIndicator]);

  useEffect(() => {
    scrollTabIntoView(index);
  }, [index, scrollTabIntoView]);

  const nudgeTabs = (direction: -1 | 1) => {
    const scroller = tablistRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * Math.max(160, scroller.clientWidth * 0.6), behavior: "smooth" });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    const move = (next: number) => {
      event.preventDefault();
      const clamped = (next + panels.length) % panels.length;
      select(clamped);
      tablistRef.current?.querySelector<HTMLElement>(`[data-continuity-tab="${clamped}"]`)?.focus();
    };
    if (event.key === "ArrowRight") move(tabIndex + 1);
    else if (event.key === "ArrowLeft") move(tabIndex - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(panels.length - 1);
  };

  const overflowing = paddleLeft || paddleRight;

  return (
    <section className="qp-continuity" aria-label="Connected">
      <div className="qp-continuity__content">
        <header className="qp-continuity__header">
          <p className="qp-continuity__eyebrow">Connected</p>
          <h2 className="qp-continuity__headline">The run stays whole.</h2>
        </header>
        <div className="qp-continuity__gallery">
          <div className="qp-continuity__stage">
            {panels.map((item, panelIndex) => {
              const selected = panelIndex === index;
              return (
                <div
                  key={item.id}
                  id={`${baseId}-${item.id}-panel`}
                  className={`qp-continuity__item${selected ? " is-current" : ""}`}
                  role="tabpanel"
                  aria-labelledby={`${baseId}-${item.id}-tab`}
                  aria-hidden={selected ? undefined : true}
                >
                  <div className="qp-continuity__frame">
                    <div className={`qp-continuity-scene qp-continuity-scene--${item.id}`} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`qp-continuity__tabnav${overflowing ? " is-overflowing" : ""}`}>
            <div className="qp-continuity__platter" ref={platterRef}>
            <div className="qp-continuity__items-wrap">
              <ul ref={tablistRef} className="qp-continuity__tabs" role="tablist" aria-label="Connected tools">
                {panels.map((item, tabIndex) => {
                  const selected = tabIndex === index;
                  return (
                    <li key={item.id} role="presentation">
                      <button
                        type="button"
                        id={`${baseId}-${item.id}-tab`}
                        className={`qp-continuity__tab${selected ? " is-current" : ""}`}
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`${baseId}-${item.id}-panel`}
                        tabIndex={selected ? 0 : -1}
                        data-continuity-tab={tabIndex}
                        onClick={() => select(tabIndex)}
                        onKeyDown={(event) => onTabKeyDown(event, tabIndex)}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div
              className="qp-continuity__indicator"
              style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
              aria-hidden="true"
            />
            <div className="qp-continuity__paddles" aria-hidden="true">
              <button
                type="button"
                className="qp-continuity__paddle qp-continuity__paddle--left"
                tabIndex={-1}
                hidden={!paddleLeft}
                onClick={() => nudgeTabs(-1)}
              >
                <PaddleIcon direction="left" />
              </button>
              <button
                type="button"
                className="qp-continuity__paddle qp-continuity__paddle--right"
                tabIndex={-1}
                hidden={!paddleRight}
                onClick={() => nudgeTabs(1)}
              >
                <PaddleIcon direction="right" />
              </button>
            </div>
            </div>
          </div>
        </div>
        <p className="qp-continuity__intro">
          Start a simulation once. The same world stays open to the studio, the agents on it, and the feeds you publish
          from it. Open it somewhere else and you are in the live world, not a copy left behind.
        </p>
        <p className="qp-continuity__cta">
          <a className="qp-continuity__link" href="#request-access">
            Request early access
            <Chevron />
          </a>
        </p>
      </div>
    </section>
  );
}
