import { Link } from "react-router-dom";

function CafeCard({ cafe, isFavorite, onToggleFavorite, favoriteBusy, actionLabel }) {
  return (
    <article className="cafe-card">
      <img className="cafe-card__image" src={cafe.image} alt={cafe.name} />
      <div className="cafe-card__content">
        <div className="cafe-card__header">
          <div>
            <h2>{cafe.name}</h2>
            <p className="cafe-card__location">
              {cafe.area}, {cafe.city}
            </p>
          </div>
          <span className="rating-badge">{cafe.rating.toFixed(1)}</span>
        </div>

        <p className="cafe-card__description">{cafe.description}</p>

        <div className="tag-row">
          {cafe.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="feature-row">
          <span>{cafe.wifi ? "Wi-Fi" : "No Wi-Fi"}</span>
          <span>{cafe.powerSockets ? "Power sockets" : "No sockets"}</span>
          <span>{cafe.openNow ? "Open now" : "Closed now"}</span>
        </div>

        <div className="card-actions">
          <Link className="button button--primary" to={`/cafe/${cafe.id}`}>
            View details
          </Link>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onToggleFavorite(cafe)}
            disabled={favoriteBusy}
          >
            {favoriteBusy ? "Saving..." : actionLabel || (isFavorite ? "Remove favorite" : "Add favorite")}
          </button>
        </div>
      </div>
    </article>
  );
}

export default CafeCard;
