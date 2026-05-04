function SkeletonCards({ count = 3 }) {
  return (
    <section className="card-grid">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="cafe-card skeleton-card">
          <div className="skeleton skeleton-card__image" />
          <div className="cafe-card__content">
            <div className="skeleton skeleton-line skeleton-line--title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
          </div>
        </article>
      ))}
    </section>
  );
}

export default SkeletonCards;
