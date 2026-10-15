import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const LETTER_STAGGER_MS = 30;
const WORDS = ["agents", "project", "business", "team", "app", "models", "product"] as const;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function RotatingWord({ interval = 4800 }: { interval?: number }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out" | "from">("in");
  const [width, setWidth] = useState<number>();
  const indexRef = useRef(0);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const nextSizerRef = useRef<HTMLSpanElement>(null);
  const word = WORDS[index] ?? "";
  const nextWord = WORDS[(index + 1) % WORDS.length] ?? word;

  useLayoutEffect(() => {
    const currentW = sizerRef.current?.offsetWidth ?? 0;
    const nextW = nextSizerRef.current?.offsetWidth ?? 0;
    const next = phase === "out" || phase === "from" ? Math.max(currentW, nextW) : currentW;
    if (next > 0) setWidth(next);
  }, [word, nextWord, phase]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  function showWord(nextIndex: number, instant: boolean) {
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    if (instant || reducedMotion()) {
      setPhase("in");
      return;
    }
    setPhase("from");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("in"));
    });
  }

  useEffect(() => {
    let cancelled = false;
    let dwellTimer = 0;
    let exitTimer = 0;

    dwellTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (document.hidden) return;
      if (reducedMotion()) {
        showWord((indexRef.current + 1) % WORDS.length, true);
        return;
      }
      const current = WORDS[indexRef.current] ?? "";
      setPhase("out");
      exitTimer = window.setTimeout(() => {
        if (cancelled) return;
        showWord((indexRef.current + 1) % WORDS.length, false);
      }, 300 + LETTER_STAGGER_MS * Math.max(0, current.length - 1));
    }, interval);

    return () => {
      cancelled = true;
      window.clearTimeout(dwellTimer);
      window.clearTimeout(exitTimer);
    };
  }, [interval, index]);

  return (
    <button
      type="button"
      className="qp-rotating-word"
      data-phase={phase}
      aria-label={`Change word, currently ${word}`}
      style={{ "--qp-rw-width": width ? `${width}px` : undefined } as CSSProperties}
      onClick={() => showWord((indexRef.current + 1) % WORDS.length, false)}
    >
      <span className="qp-sr-only">{word}</span>
      <span ref={sizerRef} className="qp-rotating-word__sizer" aria-hidden>
        {word}
      </span>
      <span ref={nextSizerRef} className="qp-rotating-word__sizer" aria-hidden>
        {nextWord}
      </span>
      <span className="qp-rotating-word__track" aria-hidden>
        <span className="qp-rotating-word__letters">
          {Array.from(word).map((letter, i) => (
            <span key={`${index}-${i}`} className="qp-rotating-word__letter" style={{ "--i": i } as CSSProperties}>
              {letter}
            </span>
          ))}
        </span>
      </span>
      <span key={index} className="qp-rotating-word__rule" aria-hidden />
    </button>
  );
}

export function HomeIntro() {
  return (
    <section className="_wt-section_tbzztj_24 jb-transparent-section qp-home-intro">
      <div className="_wt-container_tbzztj_1">
        <div className="_wt-row_mag83e_16 _wt-row_row-gap-size_0_mag83e_1 _wt-row_column-gap-size_m_mag83e_16 _wt-row_justify-content_space-between_mag83e_1 _wt-row_align-items_flex-end_mag83e_1">
          <div className="_wt-col_mag83e_1 _wt-col-6_mag83e_1 _wt-col-lg-7_mag83e_1 _wt-col-lg_mag83e_1 _wt-col-md-12_mag83e_1 _wt-col-md_mag83e_1">
            <h1 className="_rs-text-1_dz36gk_1 _rs-text_hardness_hard_dz36gk_1 air-section-title qp-home-intro__title">
              Build custom data feeds <br />
              for your <RotatingWord />
            </h1>
          </div>
          <div className="_wt-col_mag83e_1 _wt-col-5_mag83e_1 _wt-col-lg-5_mag83e_1 _wt-col-lg_mag83e_1 _wt-col-md-12_mag83e_1 _wt-col-md_mag83e_1 jb-offset-top-md-24">
            <p className="_rs-text-1_dz36gk_1 _rs-text_hardness_hard_dz36gk_1 qp-home-intro__copy">
              Give your agents a continuously updated view of the world. Qpearance gathers data from many sources, builds signals around what you track, and delivers custom feeds into your agents, apps, and workflows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
