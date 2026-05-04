import { useEffect, useMemo, useRef, useState } from "react";
import CafeCard from "../components/CafeCard";
import FilterBar from "../components/FilterBar";
import Map from "../components/Map";
import SkeletonCards from "../components/SkeletonCards";
import {
  addFavorite,
  getCafes,
  getFavorites,
  getRecommendations,
  importCafesFromPlaces,
  removeFavorite,
} from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

function Home() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [cafes, setCafes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 9, hasMore: false, total: 0 });
  const [allCities, setAllCities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [favoriteMap, setFavoriteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteBusyId, setFavoriteBusyId] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    wifi: false,
    openNow: false,
  });
  const autoImportGuard = useRef("");

  const refreshCities = async () => {
    try {
      const response = await getCafes({ pageSize: 50 });
      setAllCities([...new Set(response.data.items.map((cafe) => cafe.city))].sort());
    } catch {
      // Keep the current city list if refresh fails.
    }
  };

  const refreshRecommendations = async () => {
    try {
      setRecommendationLoading(true);
      const response = await getRecommendations({
        search: filters.search || undefined,
        city: filters.city || undefined,
      });
      setRecommendations(response.data);
    } finally {
      setRecommendationLoading(false);
    }
  };

  const loadCafes = async ({ page = 1, append = false } = {}) => {
    setLoading(true);
    setError("");

    try {
      const response = await getCafes({
        search: filters.search || undefined,
        city: filters.city || undefined,
        wifi: filters.wifi ? "true" : undefined,
        openNow: filters.openNow ? "true" : undefined,
        page,
        pageSize: pagination.pageSize,
      });

      setCafes((current) => (append ? [...current, ...response.data.items] : response.data.items));
      setPagination(response.data.pagination);
    } catch {
      setError("Could not load cafes. Make sure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCities();
  }, []);

  useEffect(() => {
    refreshRecommendations();
  }, [filters.city, filters.search]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFavoriteMap({});
      return;
    }

    getFavorites(user.id)
      .then((response) => {
        const nextMap = response.data.reduce((accumulator, cafe) => {
          accumulator[cafe.id] = cafe.favoriteId;
          return accumulator;
        }, {});
        setFavoriteMap(nextMap);
      })
      .catch(() => {});
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadCafes({ page: 1 });
  }, [filters]);

  useEffect(() => {
    if (loading || cafes.length > 0) {
      return;
    }

    const importQuery = (filters.city || filters.search || "").trim();
    if (!importQuery || autoImportGuard.current === importQuery.toLowerCase()) {
      return;
    }

    autoImportGuard.current = importQuery.toLowerCase();
    handleImportRealCafes(importQuery, true);
  }, [cafes.length, loading, filters.city, filters.search]);

  const resultsLabel = useMemo(() => {
    if (loading && cafes.length === 0) {
      return "Loading cafes...";
    }

    return `${pagination.total} cafe${pagination.total === 1 ? "" : "s"} found`;
  }, [pagination.total, loading, cafes.length]);

  const handleFilterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () => {
    autoImportGuard.current = "";
    setFilters({
      search: "",
      city: "",
      wifi: false,
      openNow: false,
    });
  };

  const handleImportRealCafes = async (forcedQuery, silent = false) => {
    const importQuery = (forcedQuery || filters.city || filters.search || "").trim();

    if (!importQuery) {
      setError("Enter a city name in Search or select a City before importing real cafes.");
      return;
    }

    setImportLoading(true);
    setError("");

    try {
      const response = await importCafesFromPlaces({
        query: importQuery,
        limit: 12,
      });

      await Promise.all([refreshCities(), refreshRecommendations()]);
      setFilters((current) => ({
        ...current,
        city: current.city || importQuery,
      }));
      await loadCafes({ page: 1 });
      if (!silent) {
        showToast(
          `${response.data.importedCount} cafe${response.data.importedCount === 1 ? "" : "s"} imported for ${importQuery}.`,
          "success"
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not import cafes from Google Places.");
    } finally {
      setImportLoading(false);
    }
  };

  const toggleFavorite = async (cafe) => {
    if (!isAuthenticated || !user) {
      setError("Please log in to save cafes to your favorites.");
      return;
    }

    const existingFavoriteId = favoriteMap[cafe.id];
    setFavoriteBusyId(cafe.id);

    setFavoriteMap((current) => {
      const next = { ...current };
      if (existingFavoriteId) {
        delete next[cafe.id];
      } else {
        next[cafe.id] = "optimistic";
      }
      return next;
    });

    try {
      if (existingFavoriteId) {
        await removeFavorite(existingFavoriteId);
        showToast(`${cafe.name} removed from favorites.`, "success");
      } else {
        const response = await addFavorite({ cafeId: cafe.id });
        setFavoriteMap((current) => ({
          ...current,
          [cafe.id]: response.data._id,
        }));
        showToast(`${cafe.name} added to favorites.`, "success");
      }
    } catch (err) {
      setFavoriteMap((current) => ({
        ...current,
        [cafe.id]: existingFavoriteId || undefined,
      }));
      if (!existingFavoriteId) {
        setFavoriteMap((current) => {
          const next = { ...current };
          delete next[cafe.id];
          return next;
        });
      }
      setError(err.response?.data?.message || "Could not update favorites right now.");
    } finally {
      setFavoriteBusyId("");
    }
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Find your next workspace cafe</p>
        <h1>Smart Cafe Finder</h1>
        <p className="hero__copy">
          Explore cafes by city, vibe, Wi-Fi availability, and whether they are open right now.
        </p>
      </section>

      <section className="dashboard-grid">
        <div>
          <FilterBar filters={filters} cities={allCities} onChange={handleFilterChange} onReset={handleReset} />

          <section className="import-card">
            <div>
              <p className="eyebrow">Real data</p>
              <h2>Import cafes from Google Places</h2>
              <p className="import-card__copy">
                Pull real cafes into MongoDB using your current city filter or search text.
              </p>
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => handleImportRealCafes()}
              disabled={importLoading}
            >
              {importLoading ? "Importing..." : "Import real cafes"}
            </button>
          </section>

          <p className="results-label">{resultsLabel}</p>

          {error && <p className="status-message status-message--error">{error}</p>}
          {!loading && !error && cafes.length === 0 && (
            <p className="status-message">No cafes matched your filters.</p>
          )}

          {loading && cafes.length === 0 ? (
            <SkeletonCards count={3} />
          ) : (
            <section className="card-grid">
              {cafes.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isFavorite={Boolean(favoriteMap[cafe.id])}
                  favoriteBusy={favoriteBusyId === cafe.id}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </section>
          )}

          {pagination.hasMore && (
            <div className="load-more-row">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => loadCafes({ page: pagination.page + 1, append: true })}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load more cafes"}
              </button>
            </div>
          )}
        </div>

        <aside className="side-panel">
          <section className="panel-card">
            <p className="eyebrow">Live map</p>
            <h2>Cafe map</h2>
            <Map cafes={cafes} />
          </section>

          <section className="panel-card">
            <p className="eyebrow">AI picks</p>
            <h2>Recommended cafes</h2>
            {recommendationLoading ? (
              <p className="status-message">Loading recommendations...</p>
            ) : (
              recommendations.map((item) => (
                <article key={item.cafeId} className="recommendation-card">
                  <h3>{item.cafeName}</h3>
                  <p>{item.summary}</p>
                  <div className="tag-row">
                    <span className="tag">Quietness: {item.quietness}</span>
                    <span className="tag">{item.studySuitability}</span>
                    <span className="tag">Popularity: {item.popularity}</span>
                  </div>
                </article>
              ))
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}

export default Home;
