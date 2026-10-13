import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "rock" | "outline" | "clear";
  size?: "m" | "s";
  href?: string;
  onDark?: boolean;
};

export function Button({
  children,
  variant = "rock",
  size = "m",
  href,
  onDark = false,
}: ButtonProps) {
  const className = [
    "qp-button",
    `qp-button--${variant}`,
    `qp-button--${size}`,
    onDark ? "qp-button--on-dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={className} type="button">
      {children}
    </button>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="qp-text-link" href={href}>
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
