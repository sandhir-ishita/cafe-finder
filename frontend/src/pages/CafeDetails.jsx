import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Map from "../components/Map";
import { addReview, getCafeById, getDirections, getReviews } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

function CafeDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [cafe, setCafe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [directions, setDirections] = useState(null);
  const [travelMode, setTravelMode] = useState("driving");
  const [routePolyline, setRoutePolyline] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [error, setError] = useState("");
  const [directionError, setDirectionError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    getCafeById(id)
      .then((response) => setCafe(response.data))
      .catch(() => setError("Could not load this cafe right now."))
      .finally(() => setLoading(false));

    getReviews(id)
      .then((response) => setReviews(response.data))
      .catch(() => {})
      .finally(() => setReviewLoading(false));
  }, [id]);

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((current) => ({ ...current, [name]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewBusy(true);

    if (reviewForm.text.trim().length < 5) {
      setError("Review text should be at least 5 characters.");
      setReviewBusy(false);
      return;
    }

    const optimisticReview = {
      _id: `temp-${Date.now()}`,
      authorName: "You",
      rating: Number(reviewForm.rating),
      text: reviewForm.text,
    };

    setReviews((current) => [optimisticReview, ...current]);

    try {
      const response = await addReview({
        cafeId: id,
        rating: Number(reviewForm.rating),
        text: reviewForm.text,
      });
      setReviews((current) => [response.data, ...current.filter((item) => item._id !== optimisticReview._id)]);
      setReviewForm({ rating: 5, text: "" });
      showToast("Review posted.", "success");
    } catch (err) {
      setReviews((current) => current.filter((item) => item._id !== optimisticReview._id));
      setError(err.response?.data?.message || "Could not add your review.");
    } finally {
      setReviewBusy(false);
    }
  };

  const handleDirections = () => {
    setDirectionError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await getDirections({
            origin: `${position.coords.latitude},${position.coords.longitude}`,
            destination: `${cafe.area}, ${cafe.city}`,
            mode: travelMode,
          });

          const route = response.data.routes?.[0];
          const leg = route?.legs?.[0];

          if (!leg) {
            setDirectionError("Directions are unavailable for this cafe right now.");
            return;
          }

          setRoutePolyline(route?.overview_polyline?.points || "");
          setDirections({
            distance: leg.distance?.text,
            duration: leg.duration?.text,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
          });
        } catch (err) {
          setDirectionError(err.response?.data?.message || "Could not load directions right now.");
        }
      },
      () => setDirectionError("Please allow location access to get directions.")
    );
  };

  if (loading) {
    return (
      <main className="page-shell">
        <p className="status-message">Loading cafe details...</p>
      </main>
    );
  }

  if (error && !cafe) {
    return (
      <main className="page-shell">
        <p className="status-message status-message--error">{error}</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Link className="back-link" to="/">
        Back to all cafes
      </Link>

      {error && <p className="status-message status-message--error">{error}</p>}

      <section className="details-card">
        <img className="details-card__image" src={cafe.image} alt={cafe.name} />
        <div className="details-card__content">
          <p className="eyebrow">Cafe details</p>
          <h1>{cafe.name}</h1>
          <p className="details-card__location">
            {cafe.area}, {cafe.city}
          </p>
          <p className="details-card__description">{cafe.description}</p>

          <div className="details-list">
            <span>Rating: {cafe.rating.toFixed(1)}</span>
            <span>Price level: {"$".repeat(cafe.priceLevel)}</span>
            <span>{cafe.wifi ? "Wi-Fi available" : "Wi-Fi not available"}</span>
            <span>{cafe.powerSockets ? "Power sockets available" : "No power sockets listed"}</span>
            <span>{cafe.openNow ? "Currently open" : "Currently closed"}</span>
          </div>

          <div className="tag-row">
            {cafe.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="card-actions">
            <label className="filter-field filter-field--inline">
              <span>Mode</span>
              <select value={travelMode} onChange={(event) => setTravelMode(event.target.value)}>
                <option value="driving">Driving</option>
                <option value="walking">Walking</option>
                <option value="bicycling">Bicycling</option>
                <option value="transit">Transit</option>
              </select>
            </label>
            <button type="button" className="button button--primary" onClick={handleDirections}>
              Get directions
            </button>
          </div>

          {directionError && <p className="status-message status-message--error">{directionError}</p>}
          {directions && (
            <div className="status-message">
              <strong>{directions.distance}</strong> away, about <strong>{directions.duration}</strong>.
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="panel-card">
          <p className="eyebrow">Map</p>
          <h2>Where it is</h2>
          <Map
            cafes={[cafe]}
            selectedCafeId={cafe.id}
            routePolyline={routePolyline}
            travelModeLabel={travelMode}
          />
        </section>

        <section className="panel-card">
          <p className="eyebrow">Reviews</p>
          <h2>Community notes</h2>
          {reviewLoading && <p className="status-message">Loading reviews...</p>}
          {!reviewLoading && reviews.length === 0 && (
            <p className="status-message">No reviews yet. Be the first to add one.</p>
          )}
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review._id} className="review-card">
                <strong>{review.authorName}</strong>
                <span>Rating: {review.rating}/5</span>
                <p>{review.text}</p>
              </article>
            ))}
          </div>

          {isAuthenticated ? (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <label className="filter-field">
                <span>Rating</span>
                <select name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-field">
                <span>Your review</span>
                <textarea
                  name="text"
                  value={reviewForm.text}
                  onChange={handleReviewChange}
                  rows="4"
                  required
                />
              </label>
              <button type="submit" className="button button--primary" disabled={reviewBusy}>
                {reviewBusy ? "Posting..." : "Post review"}
              </button>
            </form>
          ) : (
            <p className="status-message">Log in to leave a review.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export default CafeDetails;
