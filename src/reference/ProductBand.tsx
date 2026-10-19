import { useEffect, useId, useRef, useState } from "react";
import { INDUSTRIES } from "./industryField";

const AREAS = ["Feeds", "Signals", "Connections", "Sources"] as const;

function UnderlinedWord({ children }: { children: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDrawn(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={rootRef} className={`qp-catalog__mark${drawn ? " is-in" : ""}`}>
      {children}
      <span className="qp-catalog__mark-rule" aria-hidden="true" />
    </span>
  );
}

function SearchField() {
  const [query, setQuery] = useState("");

  return (
    <label className="qp-catalog__search">
      <span className="qp-sr-only">Search for a feed</span>
      <svg className="qp-catalog__search-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.92.92a6 6 0 1 1-3.8 10.62L.47 14.19a.75.75 0 0 1-1.06-1.06l2.65-2.65A6 6 0 0 1 6.92.92Zm0 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
        />
      </svg>
      <input
        className="qp-catalog__input"
        type="search"
        placeholder="Search for a feed"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <button className="qp-catalog__clear" type="button" aria-label="Clear search" onClick={() => setQuery("")}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6 0a6 6 0 1 1 0 12A6 6 0 0 1 6 0m0 5.05L3.75 2.8l-.95.95L5.05 6 2.8 8.25l.95.95L6 6.95l2.25 2.25.95-.95L6.95 6l2.25-2.25-.95-.95z"
            />
          </svg>
        </button>
      ) : null}
    </label>
  );
}

function FilterSelect({ label, options }: { label: string; options: readonly string[] }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="qp-catalog__select" data-open={open ? "true" : "false"} ref={rootRef}>
      <button
        className="qp-catalog__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value ?? label}</span>
        <svg className="qp-catalog__chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.2 6.2 8 10l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <ul
        className="qp-catalog__menu"
        id={listId}
        role="listbox"
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
      >
        {options.map((option, index) => (
          <li key={option} role="presentation" style={{ ["--i" as string]: index }}>
            <button
              className="qp-catalog__option"
              type="button"
              role="option"
              tabIndex={open ? 0 : -1}
              aria-selected={value === option}
              onClick={() => {
                setValue(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductBand() {
  return (
    <section className="qp-catalog" aria-label="Explore Qpearance">
      <div className="qp-catalog__frame">
        <h2 className="qp-catalog__title">
          <UnderlinedWord>Billions</UnderlinedWord> of reliable, live data points to explore and manage.
        </h2>
        <div className="qp-catalog__bar">
          <SearchField />
          <FilterSelect label="Industry" options={INDUSTRIES} />
          <FilterSelect label="Product area" options={AREAS} />
        </div>
      </div>
    </section>
  );
}
