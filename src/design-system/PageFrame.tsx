import type { ReactNode } from "react";
import { AnnounceBar, SiteFooter, SiteHeader } from "./Chrome";
import { Button } from "./Button";

const nav = [
  { label: "Product", to: "/" },
  { label: "Platform", to: "/platform" },
  { label: "System", to: "/system" },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "Platform", href: "/platform" },
      { label: "System", href: "/system" },
    ],
  },
  {
    title: "Work",
    links: [
      { label: "Studio", href: "/#surfaces" },
      { label: "Web", href: "/#surfaces" },
      { label: "Command line", href: "/#surfaces" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/platform" },
      { label: "Contact", href: "/platform#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/platform" },
      { label: "Terms", href: "/platform" },
    ],
  },
];

export function PageFrame({
  announce,
  children,
}: {
  announce?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="qp-page">
      <SiteHeader
        brand="Qpearance"
        items={nav}
        action={
          <Button href="/platform" size="s" onDark>
            Start
          </Button>
        }
      />
      {announce ? <AnnounceBar>{announce}</AnnounceBar> : null}
      <main>{children}</main>
      <SiteFooter columns={footerColumns} legal="Qpearance. Visual system measured from the Air page structure." />
    </div>
  );
}
