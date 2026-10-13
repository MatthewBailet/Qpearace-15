import type { ReactNode } from "react";
import { Body } from "./Type";

export function OutlineCard({
  title,
  children,
  media,
}: {
  title: string;
  children: ReactNode;
  media?: ReactNode;
}) {
  return (
    <article className="qp-card">
      {media ? <div className="qp-card__media">{media}</div> : null}
      <div className="qp-card__body">
        <h3 className="qp-heading-3">{title}</h3>
        <Body>{children}</Body>
      </div>
    </article>
  );
}

export function FeatureCard({
  title,
  children,
  media,
}: {
  title: string;
  children: ReactNode;
  media?: ReactNode;
}) {
  return (
    <article className="qp-card qp-card--fill">
      <div className="qp-card__body">
        <h3 className="qp-heading-3">{title}</h3>
        <Body>{children}</Body>
      </div>
      <div className="qp-card__media">{media}</div>
    </article>
  );
}

export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="qp-note">
      <h2 className="qp-heading-2">{title}</h2>
      <Body>{children}</Body>
    </aside>
  );
}

export function Banner({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <aside className="qp-banner">
      <h2 className="qp-heading-2">{title}</h2>
      <p className="qp-body">{children}</p>
      {action}
    </aside>
  );
}

export function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="qp-preview">
      <div className="qp-preview__body">{children}</div>
    </div>
  );
}
