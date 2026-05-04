function FilterBar({ filters, cities, onChange, onReset }) {
  return (
    <section className="filter-bar">
      <div className="filter-field filter-field--search">
        <label htmlFor="search">Search</label>
        <input
          id="search"
          name="search"
          type="text"
          value={filters.search}
          onChange={onChange}
          placeholder="Search by cafe, area, city, or tag"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="city">City</label>
        <select id="city" name="city" value={filters.city} onChange={onChange}>
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <label className="checkbox-field">
        <input
          name="wifi"
          type="checkbox"
          checked={filters.wifi}
          onChange={onChange}
        />
        <span>Wi-Fi only</span>
      </label>

      <label className="checkbox-field">
        <input
          name="openNow"
          type="checkbox"
          checked={filters.openNow}
          onChange={onChange}
        />
        <span>Open now</span>
      </label>

      <button type="button" className="button button--ghost" onClick={onReset}>
        Clear filters
      </button>
    </section>
  );
}

export default FilterBar;
