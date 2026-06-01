import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCafe, deleteCafe, getCafes, updateCafe } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

// Days of the week matching Google Places API (0 = Sunday)
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyPeriod = () => ({ open: { day: 1, time: "0800" }, close: { day: 1, time: "2100" } });

const emptyForm = {
  id: "",
  name: "",
  area: "",
  city: "",
  rating: 4.2,
  priceLevel: 2,
  wifi: false,
  powerSockets: false,
  openingHours: [],
  tags: "",
  image: "",
  description: "",
  lat: "",
  lng: "",
};

function toPayload(form) {
  return {
    id: form.id.trim(),
    name: form.name.trim(),
    area: form.area.trim(),
    city: form.city.trim(),
    rating: Number(form.rating),
    priceLevel: Number(form.priceLevel),
    wifi: form.wifi,
    powerSockets: form.powerSockets,
    openingHours: form.openingHours,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    image: form.image.trim(),
    description: form.description.trim(),
    location: {
      lat: form.lat === "" ? null : Number(form.lat),
      lng: form.lng === "" ? null : Number(form.lng),
    },
  };
}

// Helper: derive a human-readable live open/closed label from openingHours
function getLiveStatus(openingHours) {
  if (!openingHours || openingHours.length === 0) return { label: "Hours unknown", open: null };
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() * 100 + now.getMinutes();

  const isOpen = openingHours.some((p) => {
    if (p.open.day !== day) return false;
    const opens = Number(p.open.time);
    const closes = Number(p.close.time);
    if (closes < opens) return time >= opens || time < closes;
    return time >= opens && time < closes;
  });

  return { label: isOpen ? "Open now" : "Closed now", open: isOpen };
}

// ── Opening hours editor sub-component ────────────────────────────────────────
function OpeningHoursEditor({ periods, onChange }) {
  const addPeriod = () => onChange([...periods, emptyPeriod()]);

  const removePeriod = (index) => onChange(periods.filter((_, i) => i !== index));

  const updatePeriod = (index, side, field, value) => {
    const next = periods.map((p, i) =>
      i === index ? { ...p, [side]: { ...p[side], [field]: value } } : p
    );
    onChange(next);
  };

  return (
    <div className="opening-hours-editor">
      <div className="opening-hours-editor__header">
        <span>Opening hours</span>
        <button type="button" className="button button--ghost button--compact" onClick={addPeriod}>
          + Add period
        </button>
      </div>

      {periods.length === 0 && (
        <p className="status-message" style={{ fontSize: "12px", margin: "6px 0" }}>
          No hours set — openNow will show as unknown.
        </p>
      )}

      {periods.map((period, index) => (
        <div key={index} className="hours-period">
          <div className="hours-period__row">
            <label className="hours-period__label">Opens</label>
            <select
              value={period.open.day}
              onChange={(e) => updatePeriod(index, "open", "day", Number(e.target.value))}
            >
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input
              type="time"
              value={`${period.open.time.slice(0, 2)}:${period.open.time.slice(2)}`}
              onChange={(e) =>
                updatePeriod(index, "open", "time", e.target.value.replace(":", ""))
              }
            />
          </div>

          <div className="hours-period__row">
            <label className="hours-period__label">Closes</label>
            <select
              value={period.close.day}
              onChange={(e) => updatePeriod(index, "close", "day", Number(e.target.value))}
            >
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input
              type="time"
              value={`${period.close.time.slice(0, 2)}:${period.close.time.slice(2)}`}
              onChange={(e) =>
                updatePeriod(index, "close", "time", e.target.value.replace(":", ""))
              }
            />
          </div>

          <button
            type="button"
            className="button button--ghost button--compact hours-period__remove"
            onClick={() => removePeriod(index)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main ManageCafes page ──────────────────────────────────────────────────────
function ManageCafes() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [cafes, setCafes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  // FIX: Admin-only UI guard — redirect non-admins immediately.
  // The backend also enforces this, but we guard the UI so regular users
  // never see the admin panel at all.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (user?.role !== "admin") {
      showToast("Admin access required.", "error");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate, showToast]);

  const filteredCafes = useMemo(
    () =>
      cafes.filter((cafe) =>
        [cafe.name, cafe.city, cafe.area].some((v) =>
          v?.toLowerCase().includes(query.toLowerCase())
        )
      ),
    [cafes, query]
  );

  const loadCafes = async () => {
    setLoading(true);
    try {
      const response = await getCafes({ pageSize: 24 });
      setCafes(response.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load once we've confirmed the user is an admin
    if (isAuthenticated && user?.role === "admin") {
      loadCafes();
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((curr) => ({ ...curr, [name]: type === "checkbox" ? checked : value }));
  };

  const handleHoursChange = (periods) => {
    setForm((curr) => ({ ...curr, openingHours: periods }));
  };

  const handleEdit = (cafe) => {
    setEditingId(cafe.id);
    setForm({
      id: cafe.id,
      name: cafe.name,
      area: cafe.area,
      city: cafe.city,
      rating: cafe.rating,
      priceLevel: cafe.priceLevel,
      wifi: cafe.wifi,
      powerSockets: cafe.powerSockets,
      openingHours: cafe.openingHours || [],
      tags: (cafe.tags || []).join(", "),
      image: cafe.image,
      description: cafe.description,
      lat: cafe.location?.lat ?? "",
      lng: cafe.location?.lng ?? "",
    });
  };

  const handleReset = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.image || !form.description) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateCafe(editingId, payload);
        showToast("Cafe updated.", "success");
      } else {
        await createCafe(payload);
        showToast("Cafe created.", "success");
      }
      await loadCafes();
      handleReset();
    } catch (error) {
      showToast(error.response?.data?.message || "Could not save cafe.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this cafe? This cannot be undone.")) return;
    try {
      await deleteCafe(id);
      setCafes((curr) => curr.filter((c) => c.id !== id));
      showToast("Cafe deleted.", "success");
      if (editingId === id) handleReset();
    } catch (error) {
      showToast(error.response?.data?.message || "Could not delete cafe.", "error");
    }
  };

  // Don't render anything while the auth redirect is happening
  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Admin tools</p>
        <h1>Manage cafes</h1>
      </section>

      <section className="dashboard-grid">
        {/* ── Left: cafe form ── */}
        <form className="panel-card admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit cafe" : "Add cafe"}</h2>

          <div className="admin-grid">
            {[
              ["id", "ID"],
              ["name", "Name *"],
              ["area", "Area"],
              ["city", "City *"],
              ["image", "Image URL *"],
              ["rating", "Rating"],
              ["priceLevel", "Price level (1–4)"],
              ["lat", "Latitude"],
              ["lng", "Longitude"],
              ["tags", "Tags (comma-separated)"],
            ].map(([name, label]) => (
              <label key={name} className="filter-field">
                <span>{label}</span>
                <input name={name} value={form[name]} onChange={handleChange} />
              </label>
            ))}
          </div>

          <label className="filter-field">
            <span>Description *</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </label>

          {/* Amenity checkboxes */}
          <div className="tag-row">
            {[["wifi", "Wi-Fi"], ["powerSockets", "Power sockets"]].map(([field, label]) => (
              <label key={field} className="checkbox-field">
                <input
                  type="checkbox"
                  name={field}
                  checked={form[field]}
                  onChange={handleChange}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* FIX: openingHours editor replaces the static openNow checkbox */}
          <OpeningHoursEditor periods={form.openingHours} onChange={handleHoursChange} />

          <div className="card-actions">
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update cafe" : "Create cafe"}
            </button>
            <button type="button" className="button button--ghost" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        {/* ── Right: cafe list ── */}
        <section className="panel-card">
          <div className="page-heading">
            <p className="eyebrow">Cafe list</p>
            <h2>Existing cafes ({cafes.length})</h2>
          </div>

          <label className="filter-field">
            <span>Search</span>
            <input
              value={query}
              placeholder="Filter by name, city, area..."
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="admin-list">
            {loading ? (
              <p className="status-message">Loading cafes...</p>
            ) : filteredCafes.length === 0 ? (
              <p className="status-message">No cafes match your search.</p>
            ) : (
              filteredCafes.map((cafe) => {
                const { label, open } = getLiveStatus(cafe.openingHours);
                return (
                  <article key={cafe.id} className="admin-list__item">
                    <div>
                      <strong>{cafe.name}</strong>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {cafe.area}, {cafe.city}
                      </p>
                      {/* FIX: Live open/closed status badge computed from stored hours */}
                      <span
                        className="tag"
                        style={{
                          fontSize: "11px",
                          color:
                            open === true
                              ? "var(--color-text-success)"
                              : open === false
                                ? "var(--color-text-danger)"
                                : "var(--color-text-secondary)",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => handleEdit(cafe)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => handleDelete(cafe.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ManageCafes;
