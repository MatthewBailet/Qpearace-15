import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 12, suffix: "M+", label: "Live data points tracked" },
  { value: 40, suffix: "+", label: "Supported industries" },
  { value: 8, suffix: "K+", label: "Live feeds serving agents" },
] as const;

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function StatValue({ value, suffix }: { value: number; suffix: string }) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(value);
      return;
    }

    const startFrom = Math.round(value * 0.7);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        const duration = 900;
        const t0 = performance.now();
        function tick(now: number) {
          const p = Math.min(1, (now - t0) / duration);
          setShown(Math.round(startFrom + (value - startFrom) * easeOut(p)));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="qp-stats__value">
      {shown}
      {suffix}
    </span>
  );
}

export function HomeStats() {
  return (
    <section className="qp-stats" aria-label="By the numbers">
      <div className="_wt-container_tbzztj_1">
        <dl className="qp-stats__grid">
          {STATS.map((stat) => (
            <div key={stat.label} className="qp-stats__item">
              <dd className="qp-stats__dd">
                <StatValue value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="qp-stats__dt">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
