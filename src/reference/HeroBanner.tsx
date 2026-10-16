import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  INDUSTRIES,
  INDUSTRY_BLEND,
  INDUSTRY_HOLD,
  composeDot,
  fieldLayout,
  type Look,
} from "./industryField";

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
const DELAY = 0.78;
const HOLD = 0.22;
const LEAD = DELAY + HOLD;
const LAYER_STEP = 0.055;
const POP = 0.16;
const SETTLE = 0.34;

function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function easeOpenAI(t: number) {
  const p = clamp01(t);
  const cx = 0.6;
  const bx = -1.2;
  const ax = 1.6;
  let u = p;
  for (let i = 0; i < 8; i += 1) {
    const current = ((ax * u + bx) * u + cx) * u;
    const slope = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(slope) < 1e-6) break;
    u -= (current - p) / slope;
  }
  return u * u * (3 - 2 * u);
}

function arrivalFor(seed: number) {
  const roll = (hash(seed) % 1000) / 1000;
  if (roll > 0.84) return 2.75;
  if (roll > 0.62) return 1.85;
  if (roll > 0.5) return 1.28;
  return 1;
}

function buildField(radius: number) {
  const rings = 9;
  const spacing = radius / rings;
  const dots: Dot[] = [
    { x: 0, y: 0, nx: 0, ny: 0, layer: -1, arrival: 1.45, structural: hash(17) % 8 === 0 },
  ];
  for (let ring = 1; ring <= rings; ring += 1) {
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
  const end = LEAD + (LAYERS - 1) * LAYER_STEP + POP + SETTLE;
  return { dots, rest: spacing * 0.108, spacing, end };
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
      const radius = fieldLayout(width, height).radius;
      field = buildField(radius);
      paint();
    }

    function paint() {
      const clock = playback.current.reduced ? field.end : elapsed;
      const settleAt = field.end - SETTLE;
      const settled = clamp01((clock - settleAt) / SETTLE);
      const paletteLinear = playback.current.reduced ? 1 : clamp01((clock - settleAt) / 0.7);
      const palette = paletteLinear * paletteLinear * (3 - 2 * paletteLinear);
      const maxScale = field.spacing > 0 ? (field.spacing * 0.42) / field.rest : 2.2;
      const pb = playback.current;
      const from = INDUSTRIES[pb.shown] ?? INDUSTRIES[0];
      const to = pb.incoming == null ? null : INDUSTRIES[pb.incoming];
      const cx = viewW / 2;
      const cy = viewH / 2;
      context!.clearRect(0, 0, viewW, viewH);

      for (const dot of field.dots) {
        const jitter =
          dot.layer < 0 ? 0 : ((hash(dot.layer * 997 + Math.round(dot.x * 10 + dot.y * 13)) % 80) / 1000);
        const start = dot.layer < 0 ? -POP : LEAD + dot.layer * LAYER_STEP + jitter;
        const shown = easeOpenAI((clock - start) / POP);
        if (shown <= 0) continue;
        const introScale = dot.arrival + (1 - dot.arrival) * easeOpenAI(settled);
        let scale = introScale;
        let alpha = shown;
        let r = INK.r;
        let g = INK.g;
        let b = INK.b;
        if (palette > 0) {
          composeDot(from, to, pb.blend, pb.motion, pb.reduced, dot.nx, dot.ny, dot.structural, look);
          const industryScale = Math.min(look.scale, maxScale);
          scale = introScale + (industryScale - introScale) * palette;
          alpha = shown + (look.alpha - shown) * palette;
          r = INK.r + (look.r - INK.r) * palette;
          g = INK.g + (look.g - INK.g) * palette;
          b = INK.b + (look.b - INK.b) * palette;
        }
        context!.globalAlpha = alpha;
        context!.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
        context!.beginPath();
        context!.arc(cx + dot.x, cy + dot.y, field.rest * scale, 0, Math.PI * 2);
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
      const settleAt = field.end - SETTLE;
      if (elapsed < field.end) {
        if (elapsed >= settleAt) pb.motion += dt;
        return;
      }
      pb.motion += dt;
      if (pb.incoming != null) {
        pb.blend += dt / INDUSTRY_BLEND;
        if (pb.blend >= 1) {
          pb.shown = pb.incoming;
          pb.incoming = null;
          pb.blend = 0;
          pb.hold = 0;
        }
        return;
      }
      if (!pb.playing) return;
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
        if (elapsed >= field.end) announce();
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

const ARC_STEP = 0.27;
const ARC_GAP = 56;

function IndustryCarousel({
  active,
  index,
  onSelect,
  onShift,
}: {
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
  onShift: (px: number) => void;
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

  const layout = box ? fieldLayout(box.w, box.h) : { radius: 0, gap: ARC_GAP };
  const radius = layout.radius;
  const orbit = radius + layout.gap;
  const cx = box ? radius + 16 : 0;
  const cy = box ? box.h / 2 : 0;
  const shiftPx = box ? cx - box.w / 2 : 0;

  useLayoutEffect(() => {
    if (!box) return;
    onShift(shiftPx);
  }, [box, onShift, shiftPx]);

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
            if (delta > count / 2) delta -= count;
            if (delta < -count / 2) delta += count;
            const angle = delta * ARC_STEP;
            const far = Math.abs(delta) > 4;
            return (
              <span
                key={word}
                className={`qp-hero-industries-spoke${far ? " is-far" : ""}`}
                style={{
                  left: cx + Math.cos(angle) * orbit,
                  top: cy + Math.sin(angle) * orbit,
                  transform: `rotate(${angle}rad)`,
                }}
              >
                <button
                  type="button"
                  className={`qp-hero-industries-item${delta === 0 ? " is-active" : ""}`}
                  aria-checked={delta === 0}
                  role="radio"
                  tabIndex={far ? -1 : 0}
                  onClick={() => onSelect(i)}
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
  const [shift, setShift] = useState(0);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      playback.current.reduced = media.matches;
      playback.current.playing = !media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function selectIndustry(next: number) {
    playback.current.select = next;
  }

  return (
    <section className="_wt-section_tbzztj_24 _section_yRyT2 qp-home-hero">
      <div className="_hero_d8I6x">
        <div className="_wt-container_tbzztj_1 _heroContent_VoRzT">
          <div
            className={`qp-hero-layout${ready ? " is-ready" : ""}`}
            style={{ ["--qp-hero-shift" as string]: `${shift}px` }}
          >
            <IndustryCarousel active={ready} index={index} onSelect={selectIndustry} onShift={setShift} />
            <div className="qp-hero-shot">
              <HeroDotField playback={playback} onSettled={() => setReady(true)} onIndex={setIndex} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
