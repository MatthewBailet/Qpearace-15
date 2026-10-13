import type { ReactNode } from "react";

type AccentTitleProps = {
  accent?: string;
  children?: ReactNode;
};

export function DisplayTitle({ accent, children }: AccentTitleProps) {
  return (
    <h1 className="qp-display">
      {accent ? <span className="qp-display__accent">{accent}</span> : null}
      {children}
    </h1>
  );
}

export function SectionTitle({ accent, children }: AccentTitleProps) {
  return (
    <h2 className="qp-section-title">
      {accent ? <span className="qp-section-title__accent">{accent}</span> : null}
      {children}
    </h2>
  );
}

export function Heading({
  level = 2,
  children,
}: {
  level?: 2 | 3;
  children: ReactNode;
}) {
  if (level === 3) return <h3 className="qp-heading-3">{children}</h3>;
  return <h2 className="qp-heading-2">{children}</h2>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="qp-lead">{children}</p>;
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <p className={muted ? "qp-body qp-muted" : "qp-body"}>{children}</p>;
}
