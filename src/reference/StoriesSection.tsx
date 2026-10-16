const sideStories = [
  {
    title: "Coverage across the work you track",
    meta: "Coverage",
  },
  {
    title: "Classification that keeps every feed coherent",
    meta: "Models",
  },
  {
    title: "Feeds that stay current as the web changes",
    meta: "Feeds",
  },
] as const;

export function StoriesSection() {
  return (
    <section className="_wt-section_tbzztj_24 jb-transparent-section qp-stories" aria-labelledby="qp-latest-releases">
      <div className="_wt-container_tbzztj_1">
        <div className="qp-stories__bar">
          <h2 id="qp-latest-releases" className="qp-stories__heading">
            Latest Releases
          </h2>
          <a href="#releases" className="qp-stories__all">
            View all
          </a>
        </div>
        <div className="qp-stories__grid">
          <div className="qp-stories__side">
            {sideStories.map((story) => (
              <article key={story.meta} className="qp-stories__item">
                <div className="qp-stories__media" aria-hidden="true" />
                <h3 className="qp-stories__title">{story.title}</h3>
                <p className="qp-stories__meta">
                  <strong>{story.meta}</strong>
                </p>
              </article>
            ))}
          </div>
          <article className="qp-stories__feature">
            <div className="qp-stories__media" aria-hidden="true" />
            <h3 className="qp-stories__title">What is ethical data sourcing?</h3>
            <p className="qp-stories__meta">
              <strong>QRoom</strong>
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
