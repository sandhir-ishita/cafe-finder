const Cafe = require("../models/Cafe");
const { fetchGooglePlacesForImport, mapPlaceToCafe } = require("../services/mapsService");

async function searchPlaces(req, res) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(400).json({ message: "GOOGLE_MAPS_API_KEY is not configured" });
  }

  const { query, lat, lng } = req.query;
  const params = new URLSearchParams({
    query,
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  if (lat && lng) {
    params.set("location", `${lat},${lng}`);
    params.set("radius", "5000");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
  );
  const data = await response.json();
  return res.json(data);
}

async function importCafes(req, res) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(400).json({ message: "GOOGLE_MAPS_API_KEY is not configured" });
  }

  const { query = "", lat, lng, radius = 5000, limit = 10 } = req.body;
  const placesData = await fetchGooglePlacesForImport({ query, lat, lng, radius });

  if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
    return res.status(400).json({
      message: "Google Places did not return usable results",
      status: placesData.status,
      error: placesData.error_message || null,
    });
  }

  const imported = [];
  for (const place of (placesData.results || []).slice(0, Number(limit))) {
    const cafe = mapPlaceToCafe(place);
    const savedCafe = await Cafe.findOneAndUpdate({ id: cafe.id }, cafe, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }).lean();
    imported.push(savedCafe);
  }

  return res.json({
    message: "Cafe import completed",
    importedCount: imported.length,
    cafes: imported,
  });
}

async function directions(req, res) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(400).json({ message: "GOOGLE_MAPS_API_KEY is not configured" });
  }

  const { origin, destination, mode = "driving" } = req.query;
  const params = new URLSearchParams({
    origin,
    destination,
    mode,
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
  );
  const data = await response.json();
  return res.json(data);
}

// FIX: Photo proxy — the API key never leaves the server.
// Frontend requests /api/maps/photo?ref=<photo_reference>
// This replaces storing a full signed Google URL (with key) in MongoDB.
async function proxyPhoto(req, res) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(400).json({ message: "GOOGLE_MAPS_API_KEY is not configured" });
  }

  const { ref } = req.query;

  if (!ref || typeof ref !== "string" || ref.length > 500) {
    return res.status(400).json({ message: "Invalid photo reference" });
  }

  const params = new URLSearchParams({
    maxwidth: "900",
    photo_reference: ref,
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  const googleRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`
  );

  if (!googleRes.ok) {
    return res.status(502).json({ message: "Could not fetch photo from Google" });
  }

  // Cache for 7 days — Google photo references are stable
  res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  res.setHeader("Content-Type", googleRes.headers.get("content-type") || "image/jpeg");

  const buffer = await googleRes.arrayBuffer();
  return res.send(Buffer.from(buffer));
}

module.exports = {
  searchPlaces,
  importCafes,
  directions,
  proxyPhoto,
};
