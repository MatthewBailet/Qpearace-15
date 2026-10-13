import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

export type NavItem = {
  label: string;
  to: string;
};

export function SiteHeader({
  brand,
  items,
  action,
}: {
  brand: string;
  items: NavItem[];
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={open ? "qp-header qp-header--open" : "qp-header"}>
      <div className="qp-container qp-header__bar">
        <NavLink className="qp-header__brand" to="/" onClick={() => setOpen(false)}>
          {brand}
        </NavLink>
        <nav className="qp-header__nav" aria-label="Primary">
          {items.map((item) => (
            <NavLink key={item.to} className="qp-header__link" to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="qp-header__spacer" />
        <div className="qp-header__actions">{action}</div>
        <button
          className="qp-header__menu"
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close main menu" : "Open main menu"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "×" : "☰"}
        </button>
      </div>
      <div className="qp-container qp-header__panel">
        {items.map((item) => (
          <NavLink
            key={item.to}
            className="qp-header__link"
            to={item.to}
            end={item.to === "/"}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
        {action}
      </div>
    </header>
  );
}

export function AnnounceBar({ children }: { children: ReactNode }) {
  return (
    <div className="qp-announce">
      <div className="qp-container qp-announce__inner">{children}</div>
    </div>
  );
}

export function SiteFooter({
  columns,
  legal,
}: {
  columns: { title: string; links: { label: string; href: string }[] }[];
  legal: string;
}) {
  return (
    <footer className="qp-footer">
      <div className="qp-container">
        <div className="qp-footer__grid">
          {columns.map((column) => (
            <section key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="qp-footer__legal">{legal}</p>
      </div>
    </footer>
  );
}
