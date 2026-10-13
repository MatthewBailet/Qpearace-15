const CARDS = [
  {
    title: "Explore the data",
    body: "Find the sources and signals that matter to your work. Explore available data and see what you can build with it.",
    href: "#explore-data",
    cta: "Explore data",
  },
  {
    title: "Build your own feed",
    body: "Choose what to track, define the fields you need, and bring it together in a custom feed that stays updated.",
    href: "#create-feed",
    cta: "Create a feed",
  },
  {
    title: "Connect your agents",
    body: "Give your AI agents access to relevant, structured data so they can work with information beyond their training.",
    href: "#agent-connections",
    cta: "Explore agent connections",
  },
  {
    title: "Bring data into your tools",
    body: "Connect your feeds to the apps, dashboards, and workflows you already use. Keep your data close to where the work happens.",
    href: "#integrations",
    cta: "Explore integrations",
  },
  {
    title: "Know where it comes from",
    body: "Understand the sources behind your data, when it was updated, and how each value was produced.",
    href: "#data-transparency",
    cta: "Explore data transparency",
  },
  {
    title: "Build with Qpearance",
    body: "Bring custom feeds into your own applications. Explore the API, documentation, and examples to get started.",
    href: "#developer-docs",
    cta: "View developer docs",
  },
] as const;

function FeatureTextCard({
  title,
  body,
  href,
  cta,
}: (typeof CARDS)[number]) {
  return (
    <article className="air-feature-card qp-text-feature-card _wt-col_mag83e_1 _wt-col-4_mag83e_1 _wt-col-lg-6_mag83e_1 _wt-col-lg_mag83e_1 _wt-col-md-6_mag83e_1 _wt-col-md_mag83e_1">
      <div className="air-feature-card__text">
        <h3 className="_rs-h3_dz36gk_1 _rs-text_hardness_auto_dz36gk_1 air-section-thin-title">
          {title}
        </h3>
        <p className="_rs-text-2_dz36gk_1 _rs-text_hardness_hard_dz36gk_1 jb-offset-top-8">
          {body}
        </p>
        <p className="jb-offset-top-16">
          <a
            href={href}
            className="_rs-text-2_dz36gk_1 _rs-text_hardness_auto_dz36gk_1 _rs-link_dz36gk_1 _rs-link_mode_clear_dz36gk_1 qp-text-feature-card__cta"
          >
            {cta} →
          </a>
        </p>
      </div>
    </article>
  );
}

export function ExploreCardsSection() {
  return (
    <section className="_wt-section_tbzztj_24 jb-transparent-section qp-explore-cards-section">
      <div className="_wt-container_tbzztj_1">
        <div
          className="_wt-row_mag83e_16 _wt-row_row-gap-size_0_mag83e_1 _wt-row_justify-content_center_mag83e_1 _wt-row_align-items_stretch_mag83e_1 qp-explore-cards-track"
          style={{ ["--wt-horizontal-layout-gutter-default" as string]: "16px" }}
        >
          {CARDS.map((card) => (
            <FeatureTextCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
