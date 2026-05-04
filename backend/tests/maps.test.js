const test = require("node:test");
const assert = require("node:assert/strict");
const { mapPlaceToCafe } = require("../services/mapsService");

test("google places mapping creates a cafe-shaped document with source metadata", () => {
  process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "test-key";

  const mapped = mapPlaceToCafe({
    place_id: "abc123",
    name: "Study Brew",
    formatted_address: "Bandra West, Mumbai, Maharashtra, India",
    rating: 4.6,
    price_level: 2,
    opening_hours: { open_now: true },
    geometry: { location: { lat: 19.06, lng: 72.83 } },
    photos: [{ photo_reference: "photo-ref" }],
    types: ["cafe", "coffee_shop", "point_of_interest", "establishment"],
  });

  assert.equal(mapped.id, "google-abc123");
  assert.equal(mapped.city, "Mumbai");
  assert.equal(mapped.source, "google_places");
  assert.equal(mapped.googlePlaceId, "abc123");
  assert.equal(mapped.location.lat, 19.06);
  assert.equal(mapped.openNow, true);
});
