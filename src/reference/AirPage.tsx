import header from "./partials/header.html?raw";
import announce from "./partials/announce.html?raw";
import footer from "./partials/footer.html?raw";
import homeHero from "./partials/home-hero.html?raw";
import hero from "./partials/section-00.html?raw";
import surfaces from "./partials/section-01.html?raw";
import cloud from "./partials/section-02.html?raw";
import ides from "./partials/section-03.html?raw";
import teams from "./partials/section-04.html?raw";
import governance from "./partials/section-05.html?raw";
import junie from "./partials/section-06.html?raw";
import context from "./partials/section-07.html?raw";
import access from "./partials/section-08.html?raw";
import closing from "./partials/section-09.html?raw";
import { ExploreCardsSection } from "./ExploreCardsSection";
import "./slots.css";

function Slot({ html }: { html: string }) {
  return <div className="qp-slot" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SiteHeader() {
  return <Slot html={header} />;
}

export function AnnounceBar() {
  return <Slot html={announce} />;
}

export function HomeHeroSection() {
  return <Slot html={homeHero} />;
}

export function HeroSection() {
  return <Slot html={hero} />;
}

export function SurfacesSection() {
  return <Slot html={surfaces} />;
}

export function CloudSection() {
  return <Slot html={cloud} />;
}

export function IdesSection() {
  return <Slot html={ides} />;
}

export function TeamsSection() {
  return <Slot html={teams} />;
}

export function GovernanceSection() {
  return <Slot html={governance} />;
}

export function JunieSection() {
  return <Slot html={junie} />;
}

export function ContextSection() {
  return <Slot html={context} />;
}

export function AccessSection() {
  return <Slot html={access} />;
}

export function ClosingSection() {
  return <Slot html={closing} />;
}

export function SiteFooter() {
  return <Slot html={footer} />;
}

export function AirPage() {
  return (
    <div className="page-color-default-purple">
      <SiteHeader />
      <AnnounceBar />
      <div className="air-overview">
        <HomeHeroSection />
        <HeroSection />
        <ExploreCardsSection />
        <JunieSection />
        <SurfacesSection />
        <CloudSection />
        <IdesSection />
        <TeamsSection />
        <GovernanceSection />
        <ContextSection />
        <AccessSection />
        <ClosingSection />
      </div>
      <SiteFooter />
    </div>
  );
}
