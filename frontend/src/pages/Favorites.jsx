import { useEffect, useState } from "react";
import CafeCard from "../components/CafeCard";
import SkeletonCards from "../components/SkeletonCards";
import { getFavorites, removeFavorite } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

function Favorites() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    getFavorites(user.id)
      .then((response) => setCafes(response.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load your favorites right now."))
      .finally(() => setLoading(false));
  }, [user.id]);

  const toggleFavorite = async (cafe) => {
    const previous = cafes;
    setBusyId(cafe.id);
    setCafes((current) => current.filter((item) => item.id !== cafe.id));

    try {
      await removeFavorite(cafe.favoriteId);
      showToast(`${cafe.name} removed from favorites.`, "success");
    } catch (err) {
      setCafes(previous);
      setError(err.response?.data?.message || "Could not remove this favorite.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Saved for later</p>
        <h1>Your favorite cafes</h1>
      </section>

      {loading ? <SkeletonCards count={2} /> : null}
      {error && <p className="status-message status-message--error">{error}</p>}
      {!loading && !error && cafes.length === 0 && (
        <p className="status-message">You have not added any favorites yet.</p>
      )}

      {!loading && (
        <section className="card-grid">
          {cafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              isFavorite
              favoriteBusy={busyId === cafe.id}
              actionLabel="Remove favorite"
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default Favorites;
