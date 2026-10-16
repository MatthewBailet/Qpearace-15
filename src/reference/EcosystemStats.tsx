const cards = [
  {
    id: "points",
    value: "20,000,000,000+",
    label: "Live custom data points native to the Qpearance ecosystem.",
  },
  {
    id: "sectors",
    value: "600+",
    label: "Sectors with live coverage.",
  },
  {
    id: "models",
    value: "Frontier models",
    label: "Classification models that sort raw information into coherent classes, so every feed stays structured.",
  },
  {
    id: "live",
    value: "Always current",
    label: "Feeds refresh as the web changes, ready for agents, applications, and workflows.",
  },
] as const;

export function EcosystemStatsSection() {
  return (
    <section className="_wt-section_tbzztj_24 jb-transparent-section qp-proof" aria-label="Qpearance in numbers">
      <div className="_wt-container_tbzztj_1">
        <div className="qp-proof__grid">
          {[cards.slice(0, 2), cards.slice(2)].map((row) => (
            <div key={row[0].id} className="qp-proof__row">
              {row.map((card) => (
                <article key={card.id} className={`qp-proof__card qp-proof__card--${card.id}`}>
                  <p className="qp-proof__value">{card.value}</p>
                  <p className="qp-proof__label">{card.label}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
        <p className="qp-proof__note">A live record of the web, structured for the products that depend on it.</p>
      </div>
    </section>
  );
}
