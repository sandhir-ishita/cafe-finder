import { useEffect, useMemo, useState } from "react";
import { createCafe, deleteCafe, getCafes, updateCafe } from "../api";
import { useToast } from "../contexts/ToastContext";

const emptyForm = {
  id: "",
  name: "",
  area: "",
  city: "",
  rating: 4.2,
  priceLevel: 2,
  wifi: false,
  powerSockets: false,
  openNow: true,
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
    openNow: form.openNow,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    image: form.image.trim(),
    description: form.description.trim(),
    location: {
      lat: form.lat === "" ? null : Number(form.lat),
      lng: form.lng === "" ? null : Number(form.lng),
    },
  };
}

function ManageCafes() {
  const { showToast } = useToast();
  const [cafes, setCafes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const filteredCafes = useMemo(
    () =>
      cafes.filter((cafe) =>
        [cafe.name, cafe.city, cafe.area].some((value) =>
          value.toLowerCase().includes(query.toLowerCase())
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
    loadCafes();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      openNow: cafe.openNow,
      tags: cafe.tags.join(", "),
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.city || !form.image || !form.description) {
      showToast("Please fill the required cafe fields.", "error");
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
    try {
      await deleteCafe(id);
      setCafes((current) => current.filter((cafe) => cafe.id !== id));
      showToast("Cafe deleted.", "success");
      if (editingId === id) {
        handleReset();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Could not delete cafe.", "error");
    }
  };

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Admin tools</p>
        <h1>Manage cafes</h1>
      </section>

      <section className="dashboard-grid">
        <form className="panel-card admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit cafe" : "Add cafe"}</h2>
          <div className="admin-grid">
            {[
              ["id", "ID"],
              ["name", "Name"],
              ["area", "Area"],
              ["city", "City"],
              ["image", "Image URL"],
              ["rating", "Rating"],
              ["priceLevel", "Price level"],
              ["lat", "Latitude"],
              ["lng", "Longitude"],
              ["tags", "Tags"],
            ].map(([name, label]) => (
              <label key={name} className="filter-field">
                <span>{label}</span>
                <input name={name} value={form[name]} onChange={handleChange} />
              </label>
            ))}
          </div>
          <label className="filter-field">
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} />
          </label>
          <div className="tag-row">
            {["wifi", "powerSockets", "openNow"].map((field) => (
              <label key={field} className="checkbox-field">
                <input
                  type="checkbox"
                  name={field}
                  checked={form[field]}
                  onChange={handleChange}
                />
                <span>{field}</span>
              </label>
            ))}
          </div>
          <div className="card-actions">
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update cafe" : "Create cafe"}
            </button>
            <button type="button" className="button button--ghost" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        <section className="panel-card">
          <div className="page-heading">
            <p className="eyebrow">Cafe list</p>
            <h2>Existing cafes</h2>
          </div>
          <label className="filter-field">
            <span>Search cafes</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="admin-list">
            {loading ? (
              <p className="status-message">Loading cafes...</p>
            ) : (
              filteredCafes.map((cafe) => (
                <article key={cafe.id} className="admin-list__item">
                  <div>
                    <strong>{cafe.name}</strong>
                    <p>
                      {cafe.area}, {cafe.city}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button type="button" className="button button--ghost" onClick={() => handleEdit(cafe)}>
                      Edit
                    </button>
                    <button type="button" className="button button--ghost" onClick={() => handleDelete(cafe.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ManageCafes;
