import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  INDUSTRIES,
  INDUSTRY_HOLD,
  fieldLayout,
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
  spin: number;
};

const FIELD_QUIET = { r: 196, g: 194, b: 188 };
const FIELD_MARK = { r: 168, g: 166, b: 160 };
const CURRENT_CLAY = { r: 205, g: 108, b: 76 };
const CURRENT_PENCIL = { r: 228, g: 161, b: 72 };
const CURRENT_MINERAL = { r: 87, g: 142, b: 124 };
const CURRENT_PERIOD = 22;
const CURRENT_TRAIL = 9;

function mixTone(
  base: { r: number; g: number; b: number },
  swatch: { r: number; g: number; b: number },
  amount: number,
) {
  return {
    r: Math.round(base.r + (swatch.r - base.r) * amount),
    g: Math.round(base.g + (swatch.g - base.g) * amount),
    b: Math.round(base.b + (swatch.b - base.b) * amount),
  };
}

function currentPoint(phase: number) {
  const angle = phase * Math.PI * 2;
  return {
    x: 0.46 * Math.cos(angle) + 0.1 * Math.cos(2 * angle),
    y: 0.36 * Math.sin(angle) - 0.07 * Math.sin(2 * angle),
  };
}

function signalLook(structural: boolean, nx: number, ny: number, time: number) {
  const base = structural ? FIELD_MARK : FIELD_QUIET;
  const phase = time / CURRENT_PERIOD;
  let emphasis = 0;
  let swatch = CURRENT_CLAY;
  for (let step = 0; step < CURRENT_TRAIL; step += 1) {
    const point = currentPoint(phase - step * 0.016);
    const distance = Math.hypot(nx - point.x, ny - point.y);
    const near = Math.exp(-(distance * distance) / (2 * 0.15 * 0.15));
    const along = 1 - step / CURRENT_TRAIL;
    const influence = near * (0.35 + 0.65 * along);
    if (influence <= emphasis) continue;
    emphasis = influence;
    swatch = step < 3 ? CURRENT_CLAY : step < 6 ? CURRENT_PENCIL : CURRENT_MINERAL;
  }
  const amount = Math.min(0.46, 0.12 + emphasis * 0.4);
  return {
    scale: 1 + emphasis * 0.38,
    alpha: (structural ? 0.78 : 0.7) + emphasis * 0.08,
    tone: emphasis < 0.08 ? base : mixTone(base, swatch, amount),
  };
}
const LAYERS = 6;
const RINGS = 9;
const RING_LEAD = 0.08;
const PRINT_IN_AT = 0.18;
const LAYER_STEP = 0.07;
const POP = 0.24;
const SIZE_SETTLE = 0.58;
const WHEEL_ANGLE = -Math.PI / 3;
const WHEEL_SPIN = 0.86;
const WHEEL_SPIN_FINANCE = 1.05;
const WHEEL_FLARE = 0.018;
const WHEEL_BLEND_IN = 0.16;
const WHEEL_BLEND_SPAN = 0.64;
const SHOW_INDUSTRY_CAROUSEL = false;

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

function easeWheel(t: number) {
  return cubicBezier(t, 0.4, 0, 0.15, 1);
}

function wheelDuration(from: string, to: string) {
  if (from === "Finance" || to === "Finance") return WHEEL_SPIN_FINANCE;
  return WHEEL_SPIN;
}

function canvasDpr() {
  return Math.min(3, Math.max(2, window.devicePixelRatio || 1));
}

function fitCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const dpr = canvasDpr();
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return { w, h, dpr };
}

function fillDot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  dpr: number,
) {
  context.beginPath();
  context.arc(x * dpr, y * dpr, Math.max(0.9, radius * dpr), 0, Math.PI * 2);
  context.fill();
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
  const end = RING_LEAD + (LAYERS - 1) * LAYER_STEP + POP + SIZE_SETTLE;
  return { dots, rest: spacing * 0.108, spacing, end };
}

const MOTIF_BASE = { r: 142, g: 134, b: 120 };
const MOTIF_INK = { r: 92, g: 86, b: 76 };

function OfferDotMotif() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
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
      const dpr = canvasDpr();
      const targetW = Math.round(Math.max(1, Math.round(width)) * dpr);
      if (
        Math.abs(width - viewW) < 0.5 &&
        Math.abs(height - viewH) < 0.5 &&
        canvas!.width === targetW
      ) {
        return;
      }
      const fitted = fitCanvas(canvas!, context!, width, height);
      viewW = fitted.w;
      viewH = fitted.h;
      const spacing = Math.max(25, Math.min(fitted.w, fitted.h) * 0.13);
      const radius = spacing * RINGS;
      field = buildField(radius);
      origin = { cx: width, cy: height + spacing * 0.38, radius };
    }

    function paint(clock: number) {
      const dpr = canvasDpr();
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.clearRect(0, 0, canvas!.width, canvas!.height);
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
        fillDot(context!, x, y, dotR, dpr);
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
  const slot = box ? Math.max(96, box.w - cx - orbit - inset) : 160;

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
                  left: cx + Math.cos(fan) * orbit,
                  top: cy + Math.sin(fan) * orbit,
                  transform: `rotate(${fan}rad)`,
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

export function Spotlight() {
  return (
    <div className="qp-spotlight">
      <p className="qp-spotlight__eyebrow">Qpearance 1.6</p>
      <h2 className="qp-spotlight__text">
        Our next era of frontier simulation, built around your world
      </h2>
      <div className="qp-spotlight__media" role="presentation" />
    </div>
  );
}

export function HeroBanner() {
  return (
    <section className="_wt-section_tbzztj_24 _section_yRyT2 qp-home-hero">
      <div className="_hero_d8I6x">
        <ProductBand />
      </div>
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
      </div>
    </section>
  );
}

export function HomeOffer() {
  return (
    <section id="request-access" className="_wt-section_tbzztj_24 _section_yRyT2 jb-transparent-section qp-home-offer">
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
