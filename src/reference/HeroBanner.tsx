import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  INDUSTRIES,
  INDUSTRY_HOLD,
  composeDot,
  fieldLayout,
  industryBlendDuration,
  type Look,
} from "./industryField";
import { ProductBand } from "./ProductBand";

type Dot = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  layer: number;
  arrival: number;
  structural: boolean;
};

type Playback = {
  playing: boolean;
  reduced: boolean;
  visible: boolean;
  shown: number;
  incoming: number | null;
  blend: number;
  motion: number;
  hold: number;
  select: number | null;
};

const INK = { r: 42, g: 41, b: 38 };
const LAYERS = 6;
const RINGS = 9;
const CENTER_FADE = 0.32;
const CENTER_HOLD = 0.08;
const CENTER_TRAVEL = 0.68;
const CENTER_IN = CENTER_FADE + CENTER_HOLD + CENTER_TRAVEL;
const REST = 0.38;
const LEAD = CENTER_IN + REST;
const LAYER_STEP = 0.07;
const POP = 0.24;
const SIZE_SETTLE = 0.58;

function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function bezierUnit(u: number, a: number, b: number) {
  const c = 3 * a;
  const d = 3 * (b - a) - c;
  const e = 1 - c - d;
  return ((e * u + d) * u + c) * u;
}

function bezierSlope(u: number, a: number, b: number) {
  const c = 3 * a;
  const d = 3 * (b - a) - c;
  const e = 1 - c - d;
  return (3 * e * u + 2 * d) * u + c;
}

function cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number) {
  const p = clamp01(t);
  if (p <= 0 || p >= 1) return p;
  let u = p;
  for (let i = 0; i < 8; i += 1) {
    const x = bezierUnit(u, x1, x2) - p;
    const dx = bezierSlope(u, x1, x2);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
    if (u < 0 || u > 1) {
      u = clamp01(u);
      break;
    }
  }
  return bezierUnit(clamp01(u), y1, y2);
}

function easeOut(t: number) {
  return cubicBezier(t, 0.22, 1, 0.36, 1);
}

function easeReveal(t: number) {
  return cubicBezier(t, 0.16, 1, 0.3, 1);
}

function easeTravel(t: number) {
  return cubicBezier(t, 0.4, 0, 0.15, 1);
}

function centerMotion(clock: number) {
  const fade = easeOut(clock / CENTER_FADE);
  const travelAt = CENTER_FADE + CENTER_HOLD;
  const travel = easeTravel((clock - travelAt) / CENTER_TRAVEL);
  const ghost = 0.2 * fade;
  const alpha = ghost + (1 - ghost) * easeOut(travel / 0.7);
  return { fade, travel, alpha };
}

function arrivalFor(seed: number) {
  const roll = (hash(seed) % 1000) / 1000;
  if (roll > 0.84) return 2.75;
  if (roll > 0.62) return 1.85;
  if (roll > 0.5) return 1.28;
  return 1;
}

function buildField(radius: number) {
  const spacing = radius / RINGS;
  const dots: Dot[] = [
    { x: 0, y: 0, nx: 0, ny: 0, layer: -1, arrival: 1.45, structural: hash(17) % 8 === 0 },
  ];
  for (let ring = 1; ring <= RINGS; ring += 1) {
    const count = ring * 6;
    const r = ring * spacing;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const seed = ring * 2654435761 + i * 40503;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      dots.push({
        x,
        y,
        nx: radius > 0 ? x / radius : 0,
        ny: radius > 0 ? y / radius : 0,
        layer: hash(seed) % LAYERS,
        arrival: arrivalFor(seed + 97),
        structural: hash(dots.length * 131 + 17) % 8 === 0,
      });
    }
  }
  const end = LEAD + (LAYERS - 1) * LAYER_STEP + POP + SIZE_SETTLE;
  return { dots, rest: spacing * 0.108, spacing, end };
}

const MOTIF_BASE = { r: 142, g: 134, b: 120 };
const MOTIF_INK = { r: 92, g: 86, b: 76 };

function OfferDotMotif() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doneAt = (LAYERS - 1) * LAYER_STEP + 0.055 + POP;
    let frameId = 0;
    let alive = true;
    let started = false;
    let last = 0;
    let elapsed = 0;
    let viewW = 0;
    let viewH = 0;
    let field = buildField(1);
    let origin = { cx: 0, cy: 0, radius: 1 };

    function layout() {
      const width = Math.max(1, canvas!.clientWidth);
      const height = Math.max(1, canvas!.clientHeight);
      if (Math.abs(width - viewW) < 0.5 && Math.abs(height - viewH) < 0.5 && canvas!.width > 0) return;
      viewW = width;
      viewH = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const spacing = Math.max(25, Math.min(width, height) * 0.13);
      const radius = spacing * RINGS;
      field = buildField(radius);
      origin = { cx: width, cy: height + spacing * 0.38, radius };
    }

    function paint(clock: number) {
      context!.clearRect(0, 0, viewW, viewH);
      const { cx, cy, radius } = origin;
      for (const dot of field.dots) {
        if (dot.layer < 0) continue;
        const jitter = (hash(dot.layer * 997 + Math.round(dot.x * 10 + dot.y * 13)) % 55) / 1000;
        const start = dot.layer * LAYER_STEP + jitter;
        const linear = (clock - start) / POP;
        if (linear <= 0) continue;
        const shown = easeReveal(linear);
        if (shown <= 0) continue;
        const grown = 0.38 + 0.62 * shown;
        const popAlpha = easeOut(Math.min(linear, 1.2) / 0.78);
        const x = cx + dot.x;
        const y = cy + dot.y;
        const dotR = field.rest * (dot.structural ? 1.25 : 0.98) * grown;
        if (x + dotR < 0 || y + dotR < 0 || x - dotR > viewW || y - dotR > viewH) continue;
        const ink = dot.structural ? MOTIF_INK : MOTIF_BASE;
        const reach = Math.hypot(dot.x, dot.y) / radius;
        context!.globalAlpha = popAlpha * (dot.structural ? 0.92 : 0.78) * (1 - reach * 0.16);
        context!.fillStyle = `rgb(${ink.r}, ${ink.g}, ${ink.b})`;
        context!.beginPath();
        context!.arc(x, y, dotR, 0, Math.PI * 2);
        context!.fill();
      }
      context!.globalAlpha = 1;
    }

    function frame(now: number) {
      if (!alive || !started) return;
      if (last === 0) last = now;
      const raw = (now - last) / 1000;
      last = now;
      if (!document.hidden && raw < 0.25) elapsed += raw;
      layout();
      paint(reduced ? doneAt : elapsed);
      if (!reduced && elapsed < doneAt) frameId = window.requestAnimationFrame(frame);
    }

    const view = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        last = 0;
        elapsed = reduced ? doneAt : 0;
        layout();
        frameId = window.requestAnimationFrame(frame);
      },
      { threshold: 0.35 },
    );
    view.observe(canvas);

    const box = new ResizeObserver(() => {
      layout();
      if (started) paint(reduced || elapsed >= doneAt ? doneAt : elapsed);
    });
    box.observe(canvas);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      view.disconnect();
      box.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="qp-hero-offer__dots" aria-hidden="true" />;
}

function HeroDotField({
  playback,
  onSettled,
  onIndex,
}: {
  playback: RefObject<Playback>;
  onSettled?: () => void;
  onIndex?: (index: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onSettledRef = useRef(onSettled);
  const onIndexRef = useRef(onIndex);
  onSettledRef.current = onSettled;
  onIndexRef.current = onIndex;

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frameId = 0;
    let alive = true;
    let announced = false;
    let published = playback.current.shown;
    let last = 0;
    let elapsed = playback.current.reduced ? buildField(1).end : 0;
    let viewW = 1;
    let viewH = 1;
    let field = buildField(1);
    const look: Look = { r: 0, g: 0, b: 0, scale: 1, alpha: 1, emphasis: 0 };

    function announce() {
      if (announced) return;
      announced = true;
      onSettledRef.current?.();
    }

    function resize() {
      const rect = parent!.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      if (Math.abs(width - viewW) < 0.5 && Math.abs(height - viewH) < 0.5 && canvas!.width > 0) return;
      viewW = width;
      viewH = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      field = buildField(fieldLayout(width, height).radius);
      paint();
    }

    function paint() {
      const clock = playback.current.reduced ? field.end : elapsed;
      const maxScale = field.spacing > 0 ? (field.spacing * 0.42) / field.rest : 2.2;
      const pb = playback.current;
      const from = INDUSTRIES[pb.shown] ?? INDUSTRIES[0];
      const to = pb.incoming == null ? null : INDUSTRIES[pb.incoming];
      const origin = fieldLayout(viewW, viewH);
      const cx = origin.originX;
      const cy = origin.originY;
      const rise = field.spacing * RINGS;
      context!.clearRect(0, 0, viewW, viewH);

      for (const dot of field.dots) {
        const center = dot.layer < 0;
        const jitter = center
          ? 0
          : ((hash(dot.layer * 997 + Math.round(dot.x * 10 + dot.y * 13)) % 55) / 1000);
        const start = center ? 0 : LEAD + dot.layer * LAYER_STEP + jitter;
        const span = center ? CENTER_IN : POP;
        const linear = (clock - start) / span;
        if (linear <= 0) continue;
        const motion = center ? centerMotion(clock) : null;
        const shown = motion ? motion.alpha : easeReveal(linear);
        if (shown <= 0) continue;
        const grown = motion ? 0.72 + 0.28 * motion.fade : 0.38 + 0.62 * shown;
        const popAlpha = motion ? motion.alpha : easeOut(linear / 0.78);
        composeDot(from, to, pb.blend, pb.motion, pb.reduced, dot.nx, dot.ny, dot.structural, look);
        const industryScale = Math.min(look.scale, maxScale);
        const settle = pb.reduced ? 1 : easeOut((clock - start - span) / SIZE_SETTLE);
        const restScale = dot.arrival + (industryScale - dot.arrival) * settle;
        const scale = restScale * grown;
        const alpha = popAlpha + (look.alpha - popAlpha) * settle;
        const dy = motion ? (1 - motion.travel) * rise : 0;
        const r = INK.r + (look.r - INK.r) * settle;
        const g = INK.g + (look.g - INK.g) * settle;
        const b = INK.b + (look.b - INK.b) * settle;
        context!.globalAlpha = alpha;
        context!.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
        context!.beginPath();
        context!.arc(cx + dot.x, cy + dot.y + dy, field.rest * scale, 0, Math.PI * 2);
        context!.fill();
      }
      context!.globalAlpha = 1;
    }

    function advance(dt: number) {
      const pb = playback.current;
      if (pb.select != null) {
        const target = pb.select;
        pb.select = null;
        const dominant = pb.incoming != null && pb.blend >= 0.5 ? pb.incoming : pb.shown;
        if (pb.reduced || target === dominant) {
          pb.shown = target;
          pb.incoming = null;
          pb.blend = 0;
        } else {
          pb.shown = dominant;
          pb.incoming = target;
          pb.blend = 0;
        }
      }
      if (pb.reduced) {
        elapsed = field.end;
        return;
      }
      if (elapsed < field.end) {
        if (elapsed >= LEAD) pb.motion += dt;
        return;
      }
      if (!pb.playing) return;
      pb.motion += dt;
      if (pb.incoming != null) {
        pb.blend += dt / industryBlendDuration(INDUSTRIES[pb.shown], INDUSTRIES[pb.incoming]);
        if (pb.blend >= 1) {
          pb.shown = pb.incoming;
          pb.incoming = null;
          pb.blend = 0;
          pb.hold = 0;
        }
        return;
      }
      pb.hold += dt;
      if (pb.hold >= INDUSTRY_HOLD) {
        pb.incoming = (pb.shown + 1) % INDUSTRIES.length;
        pb.blend = 0;
        pb.hold = 0;
      }
    }

    function tick(now: number) {
      if (!alive) return;
      if (last === 0) last = now;
      const raw = (now - last) / 1000;
      last = now;
      const frozen = document.hidden || !playback.current.visible;
      const dt = frozen || raw > 0.25 ? 0 : raw;
      if (!frozen) {
        elapsed += dt;
        advance(dt);
        paint();
        if (elapsed >= LEAD + (LAYERS - 1) * LAYER_STEP + POP * 0.45) announce();
        const label = playback.current.incoming ?? playback.current.shown;
        if (label !== published) {
          published = label;
          onIndexRef.current?.(label);
        }
      }
      frameId = window.requestAnimationFrame(tick);
    }

    resize();
    const boxObserver = new ResizeObserver(resize);
    boxObserver.observe(parent);
    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        playback.current.visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    viewObserver.observe(parent);
    if (playback.current.reduced) {
      elapsed = field.end;
      paint();
      announce();
    }
    frameId = window.requestAnimationFrame(tick);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      boxObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [playback]);

  return <canvas ref={ref} className="qp-hero-dots" aria-hidden="true" />;
}

const ARC_STEP = 0.175;
const ARC_GAP = 40;
const ARC_VISIBLE = 6;
const LABEL_SAMPLE = 100;
const LABEL_TRACKING = -0.022;
const LABEL_MIN = 20;
const LABEL_MAX = 38;

let labelCtx: CanvasRenderingContext2D | null | undefined;

function wordWidthAtSample(word: string) {
  if (labelCtx === undefined) {
    labelCtx = document.createElement("canvas").getContext("2d");
  }
  if (!labelCtx) return word.length * 58;
  labelCtx.font = `500 ${LABEL_SAMPLE}px "Qpearance Sans", ui-sans-serif, system-ui, sans-serif`;
  return labelCtx.measureText(word).width + LABEL_TRACKING * LABEL_SAMPLE * Math.max(0, word.length - 1);
}

function labelFit(word: string, slot: number) {
  const natural = wordWidthAtSample(word);
  if (natural <= 0) return { size: 28, slot };
  const size = Math.max(LABEL_MIN, Math.min(LABEL_MAX, LABEL_SAMPLE * (slot / natural)));
  return { size, slot };
}

function IndustryCarousel({
  active,
  index,
  onSelect,
}: {
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const count = INDUSTRIES.length;

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBox({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = box
    ? fieldLayout(box.w, box.h)
    : { radius: 0, gap: ARC_GAP, originX: 0, originY: 0 };
  const orbit = layout.radius + layout.gap;
  const cx = layout.originX;
  const cy = layout.originY;
  const inset = box && box.w < 640 ? 20 : 32;
  const slot = box ? Math.max(96, cx - orbit - inset) : 160;

  return (
    <div
      className="qp-hero-industries"
      ref={rootRef}
      aria-hidden={!active}
      role="radiogroup"
      aria-label="Industries"
    >
      {box
        ? INDUSTRIES.map((word, i) => {
            let delta = i - index;
            const half = count / 2;
            while (delta > half) delta -= count;
            while (delta <= -half) delta += count;
            const fan = delta * ARC_STEP;
            const far = Math.abs(delta) > ARC_VISIBLE;
            const fit = labelFit(word, slot);
            return (
              <span
                key={word}
                className={`qp-hero-industries-spoke${far ? " is-far" : ""}`}
                style={{
                  left: cx - Math.cos(fan) * orbit,
                  top: cy + Math.sin(fan) * orbit,
                  transform: `rotate(${-fan}rad)`,
                }}
              >
                <button
                  type="button"
                  className={`qp-hero-industries-item${delta === 0 ? " is-active" : ""}`}
                  aria-checked={delta === 0}
                  role="radio"
                  tabIndex={far ? -1 : 0}
                  onClick={() => onSelect(i)}
                  style={{
                    ["--qp-label-size" as string]: `${fit.size}px`,
                    ["--qp-label-slot" as string]: `${fit.slot}px`,
                  }}
                >
                  {word}
                </button>
              </span>
            );
          })
        : null}
      <span className="qp-hero-industries-live" aria-live="polite">
        {INDUSTRIES[index]}
      </span>
    </div>
  );
}

export function HeroBanner() {
  const playback = useRef<Playback>({
    playing: true,
    reduced: false,
    visible: true,
    shown: 0,
    incoming: null,
    blend: 0,
    motion: 0,
    hold: 0,
    select: null,
  });
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      playback.current.reduced = media.matches;
      playback.current.playing = !media.matches;
      setPlaying(!media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function selectIndustry(next: number) {
    playback.current.select = next;
  }

  function togglePlayback() {
    if (playback.current.reduced) return;
    const next = !playback.current.playing;
    playback.current.playing = next;
    setPlaying(next);
  }

  return (
    <section className="_wt-section_tbzztj_24 _section_yRyT2 qp-home-hero">
      <ProductBand />
      <div className="_hero_d8I6x">
        <div className="qp-hero-pair">
          <article className="qp-hero-pair__card qp-hero-pair__card--narrow">
            <div className="qp-hero-pair__copy">
              <h2 className="qp-hero-pair__title">Create a feed</h2>
              <p className="qp-hero-pair__desc">Choose what to track and keep it updated.</p>
            </div>
          </article>
          <article className="qp-hero-pair__card qp-hero-pair__card--wide">
            <div className="qp-hero-pair__copy">
              <h2 className="qp-hero-pair__title">Connect and manage</h2>
              <p className="qp-hero-pair__desc">Send feeds to your agents, apps, and workflows.</p>
            </div>
          </article>
        </div>
        <div
          className={`qp-hero-stage${ready ? " is-ready" : ""}${playing ? "" : " is-paused"}`}
        >
          <div className="qp-hero-layout">
            <IndustryCarousel active={ready} index={index} onSelect={selectIndustry} />
            <div className="qp-hero-shot">
              <HeroDotField playback={playback} onSettled={() => setReady(true)} onIndex={setIndex} />
            </div>
          </div>
          <button
            className="qp-hero-transport"
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlayback}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="4" y="3" width="2.5" height="10" rx="0.8" />
                <rect x="9.5" y="3" width="2.5" height="10" rx="0.8" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 3.2v9.6L13 8z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export function HomeOffer() {
  return (
    <section className="_wt-section_tbzztj_24 _section_yRyT2 jb-transparent-section qp-home-offer">
      <div className="_hero_d8I6x">
        <article className="qp-hero-offer">
          <div className="qp-hero-offer__copy">
            <div className="qp-hero-offer__lead">
              <p className="qp-hero-offer__kicker">Announcements</p>
              <h2 className="qp-hero-offer__title">
                Try Qpearance <span className="qp-hero-offer__beta">Beta</span> for free today
              </h2>
            </div>
            <div className="qp-hero-offer__actions">
              <a className="qp-hero-offer__btn qp-hero-offer__btn--access" href="#request-access">
                Request access
                <svg className="qp-btn-chevron" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M6.2 3.2 11 8 6.2 12.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a className="qp-hero-offer__btn qp-hero-offer__btn--google" href="#sign-in">
                <svg className="qp-hero-offer__google" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Sign up with Google
                <svg className="qp-btn-chevron" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M6.2 3.2 11 8 6.2 12.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
          <OfferDotMotif />
        </article>
      </div>
    </section>
  );
}
