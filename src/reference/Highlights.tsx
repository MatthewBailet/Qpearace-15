import type { ReactNode } from "react";
import { MediaCardGallery, type MediaCardItem } from "../design-system/MediaCardGallery";
import "./highlights.css";

function Scene({
  name,
  clear,
  children,
}: {
  name: string;
  clear: "top" | "bottom" | "start";
  children: ReactNode;
}) {
  return (
    <div className={`qp-highlight-scene qp-highlight-scene--${name} qp-highlight-scene--clear-${clear}`} aria-hidden="true">
      <div className="qp-highlight-drift">{children}</div>
      <div className="qp-highlight-scene__clear" />
    </div>
  );
}

const cards: MediaCardItem[] = [
  {
    id: "world",
    label: "World",
    title: (
      <>
        Cities, weather, and crowds.
        <br />
        One live environment.
      </>
    ),
    placement: { edge: "top", align: "center" },
    media: (
      <Scene name="world" clear="top">
        <span className="qp-highlight-field" />
        <span className="qp-highlight-sun" />
        <span className="qp-highlight-haze" />
        <span className="qp-highlight-horizon" />
      </Scene>
    ),
  },
  {
    id: "web",
    label: "Web",
    title: (
      <>
        Pages, sessions, and traffic.
        <br />
        A site, still running.
      </>
    ),
    placement: { edge: "top", align: "start" },
    media: (
      <Scene name="web" clear="start">
        <span className="qp-highlight-panel" />
        <span className="qp-highlight-bar qp-highlight-bar-a" />
        <span className="qp-highlight-bar qp-highlight-bar-b" />
        <span className="qp-highlight-bar qp-highlight-bar-c" />
        <span className="qp-highlight-bar qp-highlight-bar-d" />
        <span className="qp-highlight-bar qp-highlight-bar-e" />
      </Scene>
    ),
  },
  {
    id: "operations",
    label: "Operations",
    title: (
      <>
        Plants, wards, and warehouses.
        <br />
        The work inside, still moving.
      </>
    ),
    placement: { edge: "bottom", align: "center" },
    compact: { edge: "top", align: "center" },
    media: (
      <Scene name="operations" clear="bottom">
        <span className="qp-highlight-slab qp-highlight-slab-a" />
        <span className="qp-highlight-slab qp-highlight-slab-b" />
        <span className="qp-highlight-slab qp-highlight-slab-c" />
      </Scene>
    ),
  },
  {
    id: "commerce",
    label: "Commerce",
    title: (
      <>
        Catalogs, demand, and checkout.
        <br />
        Current as the market moves.
      </>
    ),
    placement: { edge: "top", align: "center" },
    media: (
      <Scene name="commerce" clear="top">
        <span className="qp-highlight-tile qp-highlight-tile-a" />
        <span className="qp-highlight-tile qp-highlight-tile-b" />
        <span className="qp-highlight-tile qp-highlight-tile-c" />
        <span className="qp-highlight-tile qp-highlight-tile-d" />
      </Scene>
    ),
  },
  {
    id: "mobility",
    label: "Mobility",
    title: (
      <>
        Roads, fleets, and ports.
        <br />
        Nothing else has to freeze.
      </>
    ),
    placement: { edge: "bottom", align: "start" },
    compact: { edge: "top", align: "start" },
    media: (
      <Scene name="mobility" clear="bottom">
        <span className="qp-highlight-route qp-highlight-route-a" />
        <span className="qp-highlight-route qp-highlight-route-b" />
        <span className="qp-highlight-route qp-highlight-route-c" />
      </Scene>
    ),
  },
  {
    id: "markets",
    label: "Markets",
    title: (
      <>
        Risk and conditions.
        <br />
        Plans that stay aligned.
      </>
    ),
    placement: { edge: "top", align: "end" },
    compact: { edge: "top", align: "center" },
    media: (
      <Scene name="markets" clear="top">
        <span className="qp-highlight-core" />
        <svg className="qp-highlight-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="72" />
        </svg>
      </Scene>
    ),
  },
  {
    id: "session",
    label: "Session",
    title: (
      <>
        One session, anywhere.
        <br />
        Studio, browser, and cloud.
      </>
    ),
    note: "Open to a limited set of teams.",
    placement: { edge: "top", align: "center" },
    media: (
      <Scene name="session" clear="top">
        <span className="qp-highlight-column qp-highlight-column-a" />
        <span className="qp-highlight-column qp-highlight-column-b" />
        <span className="qp-highlight-column qp-highlight-column-c" />
      </Scene>
    ),
  },
];

export function Highlights() {
  return (
    <MediaCardGallery
      id="highlights"
      title="Across the real work."
      label="Highlights"
      cards={cards}
    />
  );
}
