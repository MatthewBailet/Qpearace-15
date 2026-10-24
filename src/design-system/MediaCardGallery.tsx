import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./media-card-gallery.css";

const AUTOPLAY_MS = 6150;

export type CaptionPlacement = {
  edge?: "top" | "bottom" | "center";
  align?: "center" | "start" | "end";
};

export type MediaCardItem = {
  id: string;
  label: string;
  title: ReactNode;
  note?: ReactNode;
  placement?: CaptionPlacement;
  compact?: CaptionPlacement;
  tone?: "light" | "dark";
  duration?: number;
  videoSrc?: string;
  poster?: string;
  media?: ReactNode;
};

type MediaCardGalleryProps = {
  id?: string;
  title: string;
  label?: string;
  action?: { href: string; label: string };
  cards: MediaCardItem[];
};

function itemOffset(scroller: HTMLElement, item: HTMLElement) {
  const small = window.matchMedia("(width <= 640px)").matches;
  if (small) {
    const pad = Number.parseFloat(getComputedStyle(scroller).scrollPaddingInlineStart) || 20;
    return Math.max(0, item.offsetLeft - pad);
  }
  return Math.max(0, item.offsetLeft - (scroller.clientWidth - item.offsetWidth) / 2);
}

function nearestIndex(scroller: HTMLElement) {
  const items = [...scroller.querySelectorAll<HTMLElement>("[data-card]")];
  const mark = scroller.scrollLeft + scroller.clientWidth / 2;
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  items.forEach((item, index) => {
    const mid = item.offsetLeft + item.offsetWidth / 2;
    const distance = Math.abs(mid - mark);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

export function MediaCardGallery({
  id = "media-card-gallery",
  title,
  label = "Highlights",
  action,
  cards,
}: MediaCardGalleryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const cardsRef = useRef(cards);
  const indexRef = useRef(0);
  const phaseRef = useRef<"playing" | "paused" | "ended">("paused");
  const progressRef = useRef(0);
  const programmatic = useRef(false);
  const targetLeft = useRef<number | null>(null);
  const gesture = useRef(false);
  const userPaused = useRef(false);
  cardsRef.current = cards;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"playing" | "paused" | "ended">("paused");
  const [settled, setSettled] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const paint = useCallback((value: number) => {
    dotsRef.current?.style.setProperty("--qp-progress", String(Math.min(1, Math.max(0, value))));
  }, []);

  const setPlayback = useCallback((next: "playing" | "paused" | "ended") => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const goTo = useCallback(
    (next: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      const item = scroller?.querySelectorAll<HTMLElement>("[data-card]")[next];
      if (!scroller || !item) return;
      const left = itemOffset(scroller, item);
      const previous = videoRefs.current[indexRef.current];
      if (previous && indexRef.current !== next) previous.currentTime = 0;
      indexRef.current = next;
      progressRef.current = 0;
      paint(0);
      setIndex(next);
      if (Math.abs(scroller.scrollLeft - left) < 2) {
        programmatic.current = false;
        targetLeft.current = null;
        setSettled(true);
        return;
      }
      programmatic.current = true;
      targetLeft.current = left;
      setSettled(false);
      scroller.scrollTo({ left, behavior });
    },
    [paint],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let timer = 0;
    const finish = () => {
      if (programmatic.current) {
        const target = targetLeft.current;
        if (target !== null && Math.abs(scroller.scrollLeft - target) > 8) return;
        programmatic.current = false;
        targetLeft.current = null;
        gesture.current = false;
        setSettled(true);
        return;
      }
      gesture.current = false;
      const next = nearestIndex(scroller);
      if (next !== indexRef.current) {
        videoRefs.current[indexRef.current]?.pause();
        indexRef.current = next;
        progressRef.current = 0;
        paint(0);
        setIndex(next);
        if (phaseRef.current === "playing") setPlayback("paused");
      }
      setSettled(true);
    };
    const onScroll = () => {
      if (gesture.current && !programmatic.current && phaseRef.current === "playing") {
        userPaused.current = true;
        setPlayback("paused");
      }
      if (programmatic.current) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(finish, 160);
    };
    const arm = () => {
      gesture.current = true;
      programmatic.current = false;
      targetLeft.current = null;
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > 2 && Math.abs(event.deltaX) > Math.abs(event.deltaY)) arm();
    };
    scroller.addEventListener("pointerdown", arm);
    scroller.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("scrollend", finish);
    return () => {
      window.clearTimeout(timer);
      scroller.removeEventListener("pointerdown", arm);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", finish);
    };
  }, [paint, setPlayback]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        if (visible) setRevealed(true);
        if (reduced || userPaused.current || phaseRef.current === "ended") return;
        if (visible) setPlayback("playing");
        else if (phaseRef.current === "playing") setPlayback("paused");
      },
      { threshold: [0, 0.45, 0.75] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [setPlayback]);

  useEffect(() => {
    if (phase !== "playing" || !settled) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      if (document.hidden) {
        last = now;
        frame = requestAnimationFrame(step);
        return;
      }
      const dt = Math.min(48, now - last);
      last = now;
      const current = cardsRef.current[indexRef.current];
      const duration = current?.duration ?? AUTOPLAY_MS;
      const video = videoRefs.current[indexRef.current];
      let value = progressRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0 && !video.paused) {
        value = video.currentTime / video.duration;
      } else {
        value += dt / duration;
      }
      if (value >= 1) {
        const lastIndex = cardsRef.current.length - 1;
        if (indexRef.current >= lastIndex) {
          progressRef.current = 1;
          paint(1);
          setPlayback("ended");
          return;
        }
        goTo(indexRef.current + 1);
        return;
      }
      progressRef.current = value;
      paint(value);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [goTo, paint, phase, settled, setPlayback]);

  useEffect(() => {
    videoRefs.current.forEach((video, cardIndex) => {
      if (!video) return;
      const active = cardIndex === index && phase === "playing" && settled;
      if (active) {
        void video.play().catch(() => {});
        return;
      }
      video.pause();
      if (cardIndex !== index) video.currentTime = 0;
    });
  }, [index, phase, settled]);

  useEffect(() => {
    const onResize = () => {
      const scroller = scrollerRef.current;
      const item = scroller?.querySelectorAll<HTMLElement>("[data-card]")[indexRef.current];
      if (!scroller || !item) return;
      programmatic.current = true;
      scroller.scrollTo({ left: itemOffset(scroller, item), behavior: "auto" });
      window.setTimeout(() => {
        programmatic.current = false;
      }, 80);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onToggle = () => {
    if (phase === "ended") {
      userPaused.current = false;
      setPlayback("playing");
      goTo(0);
      return;
    }
    if (phase === "playing") {
      userPaused.current = true;
      setPlayback("paused");
      return;
    }
    userPaused.current = false;
    setPlayback("playing");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest(".qp-gallery__header")) return;
    const next =
      event.key === "ArrowRight" ? Math.min(cards.length - 1, index + 1)
      : event.key === "ArrowLeft" ? Math.max(0, index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? cards.length - 1
      : null;
    if (next === null || next === index) return;
    event.preventDefault();
    if (phaseRef.current === "ended") setPlayback("paused");
    goTo(next);
  };

  const verb = phase === "playing" ? "Pause" : phase === "ended" ? "Replay" : "Play";

  return (
    <section
      ref={rootRef}
      id={id}
      className={`qp-gallery${revealed ? " is-revealed" : ""}`}
      data-phase={phase}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div className="qp-gallery__header">
        <h2 className="qp-gallery__heading">{title}</h2>
        {action ? (
          <a className="qp-gallery__action" href={action.href}>
            {action.label}
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 8h9.2M9.2 4.2 13 8l-3.8 3.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        ) : null}
      </div>
      <div className="qp-gallery__stage">
        <div ref={scrollerRef} className="qp-gallery__scroller" tabIndex={-1}>
          <ul className="qp-gallery__track">
            {cards.map((card, cardIndex) => {
              const current = cardIndex === index;
              const edge = card.placement?.edge ?? "top";
              const align = card.placement?.align ?? "center";
              return (
                <li
                  key={card.id}
                  id={`${id}-item-${cardIndex + 1}`}
                  className={`qp-gallery__item${current ? " is-current" : ""}`}
                  data-card=""
                  data-tone={card.tone ?? "light"}
                  role="tabpanel"
                  aria-labelledby={`${id}-tab-${cardIndex + 1}`}
                  inert={!current}
                  aria-hidden={current ? undefined : true}
                >
                  <article className="qp-gallery__card">
                    <div className="qp-gallery__media">
                      {card.videoSrc ? (
                        <video
                          ref={(node) => {
                            videoRefs.current[cardIndex] = node;
                          }}
                          className="qp-gallery__video"
                          src={card.videoSrc}
                          poster={card.poster}
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : null}
                      {card.media}
                    </div>
                    <div
                      className="qp-gallery__caption"
                      data-edge={edge}
                      data-align={align}
                      data-compact-edge={card.compact?.edge}
                      data-compact-align={card.compact?.align}
                    >
                      <div className="qp-gallery__caption-copy">
                        <p className="qp-gallery__headline">{card.title}</p>
                        {card.note ? <p className="qp-gallery__note">{card.note}</p> : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="qp-gallery__controls">
          <button
            className="qp-gallery__play"
            type="button"
            aria-pressed={phase === "playing"}
            aria-label={`${verb} ${label} gallery`}
            onClick={onToggle}
          >
            <span className="qp-gallery__icons">
              <svg className="qp-gallery__icon-play" viewBox="0 0 56 56" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M23.76 36.62c.45 0 .86-.13 1.42-.46l10.92-6.33c.86-.5 1.36-1.02 1.36-1.84 0-.8-.5-1.32-1.36-1.82l-10.92-6.33c-.56-.33-.98-.47-1.42-.47-.93 0-1.76.72-1.76 1.94v13.37c0 1.22.83 1.94 1.76 1.94z"
                />
              </svg>
              <svg className="qp-gallery__icon-pause" viewBox="0 0 56 56" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.73 36.67h2.54c1.15 0 1.73-.58 1.73-1.72V21.05c0-1.12-.58-1.69-1.73-1.72h-2.54c-1.15 0-1.73.57-1.73 1.72v13.9c-.03 1.14.55 1.72 1.73 1.72zm10 0h2.53c1.15 0 1.73-.58 1.73-1.72V21.05c0-1.12-.58-1.72-1.73-1.72h-2.53c-1.15 0-1.73.57-1.73 1.72v13.9c0 1.14.55 1.72 1.73 1.72z"
                />
              </svg>
              <svg className="qp-gallery__icon-replay" viewBox="0 0 56 56" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M36.24 26.64c-1.1 0-2 .9-2 2 0 3.44-2.8 6.24-6.24 6.24s-6.24-2.8-6.24-6.24 2.8-6.24 6.24-6.24c.03 0 .05 0 .08 0l-1.28 1.28c-.79.79-.79 2.06 0 2.84.39.39.9.59 1.42.59s1.03-.2 1.42-.59l4.44-4.44c.78-.78.78-2.05 0-2.83l-4.66-4.66c-.78-.78-2.05-.78-2.83 0-.79.78-.79 2.05 0 2.83l1 .99c-5.46.23-9.83 4.72-9.83 10.23 0 5.65 4.6 10.25 10.25 10.25s10.25-4.6 10.25-10.25c0-1.11-.9-2.01-2.01-2.01z"
                />
              </svg>
            </span>
          </button>
          <div ref={dotsRef} className="qp-gallery__tabs" style={{ ["--qp-progress" as string]: 0 }}>
            <div className="qp-gallery__dotlist" role="tablist" aria-label={`${label} tablist`}>
              {cards.map((card, cardIndex) => {
                const current = cardIndex === index;
                return (
                  <button
                    key={card.id}
                    id={`${id}-tab-${cardIndex + 1}`}
                    className="qp-gallery__dot"
                    type="button"
                    role="tab"
                    aria-selected={current}
                    aria-controls={`${id}-item-${cardIndex + 1}`}
                    tabIndex={current ? 0 : -1}
                    onClick={() => {
                      if (phaseRef.current === "ended") setPlayback("paused");
                      goTo(cardIndex);
                    }}
                  >
                    <span className="qp-gallery__dot-fill" />
                    <span className="qp-gallery__sr">{card.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
