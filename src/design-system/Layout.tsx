import type { ReactNode } from "react";

export function Section({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <section className="qp-section" id={id}>
      {children}
    </section>
  );
}

export function Container({ children }: { children: ReactNode }) {
  return <div className="qp-container">{children}</div>;
}

export function Cluster({ children }: { children: ReactNode }) {
  return <div className="qp-cluster">{children}</div>;
}

type GridProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

export function Grid({ children, columns = 2 }: GridProps) {
  return <div className={`qp-grid qp-grid--${columns}`}>{children}</div>;
}
