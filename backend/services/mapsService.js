const { parseAddressParts, slugify } = require("../utils/cafeHelpers");

function getPhotoReference(place) {
  const ref = place.photos?.[0]?.photo_reference;
  if (!ref) return null;
  return ref;
}

// FIX: Extract structured opening hours periods from Google Places data.
// These are stored in DB so openNow can be computed live at query time.
function extractOpeningHours(place) {
  const periods = place.opening_hours?.periods;
  if (!Array.isArray(periods) || periods.length === 0) return [];

  return periods
    .filter(
      (p) =>
        p?.open?.day !== undefined &&
        p?.open?.time !== undefined &&
        p?.close?.day !== undefined &&
        p?.close?.time !== undefined
    )
    .map((p) => ({
      open: { day: p.open.day, time: p.open.time },
      close: { day: p.close.day, time: p.close.time },
    }));
}

function mapPlaceToCafe(place) {
  const { area, city } = parseAddressParts(place.formatted_address || place.vicinity || "");
  const placeName = place.name || "Unnamed Cafe";
  const tags = Array.isArray(place.types)
    ? place.types
        .filter((type) => !["point_of_interest", "establishment", "food", "store"].includes(type))
        .slice(0, 5)
        .map((type) => type.replace(/_/g, " "))
    : [];

  const photoRef = getPhotoReference(place);

  return {
    id: `google-${place.place_id || slugify(placeName)}`,
    name: placeName,
    area,
    city,
    rating: typeof place.rating === "number" ? place.rating : 4,
    priceLevel:
      typeof place.price_level === "number" ? Math.min(Math.max(place.price_level, 1), 4) : 2,
    wifi: tags.some((tag) => ["cafe", "coffee", "bakery"].includes(tag)) || false,
    powerSockets: false,
    // FIX: Store structured hours instead of a static boolean
    openingHours: extractOpeningHours(place),
    location: {
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
    },
    tags: tags.length ? tags : ["cafe", "coffee"],
    image: photoRef
      ? `__google_photo__${photoRef}`
      : "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    description:
      place.editorial_summary?.overview ||
      `${placeName} in ${city} discovered from Google Places. Great for exploring real cafes nearby.`,
    source: "google_places",
    googlePlaceId: place.place_id || null,
    googleMetadata: {
      businessStatus: place.business_status || null,
      userRatingsTotal: place.user_ratings_total || 0,
      formattedAddress: place.formatted_address || place.vicinity || null,
      types: place.types || [],
    },
  };
}

async function fetchGooglePlacesForImport({ query, lat, lng, radius = 5000 }) {
  if (lat && lng) {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      type: "cafe",
      key: process.env.GOOGLE_MAPS_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Google Places request failed with status ${response.status}`);
    }

    return response.json();
  }

  const normalizedQuery = query.toLowerCase().includes("cafe") ? query : `cafes in ${query}`;
  const params = new URLSearchParams({
    query: normalizedQuery,
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Places request failed with status ${response.status}`);
  }

  return response.json();
}

module.exports = {
  fetchGooglePlacesForImport,
  mapPlaceToCafe,
  getPhotoReference,
};

