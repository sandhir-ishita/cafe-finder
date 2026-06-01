const Cafe = require("../models/Cafe");
const Review = require("../models/Review");
const { normalizeCafePayload } = require("../utils/cafeHelpers");
const {
  buildRecommendationFallback,
  fetchOpenAIRecommendation,
} = require("../services/recommendationService");

// openNow is now a virtual computed from openingHours.
// For filtering we compute it in JS after fetching rather than in the DB query,
// since Mongoose virtuals aren't available in raw .lean() results.
function isOpenNow(openingHours) {
  if (!openingHours || openingHours.length === 0) return null;
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() * 100 + now.getMinutes();

  return openingHours.some((period) => {
    if (period.open.day !== day) return false;
    const opens = Number(period.open.time);
    const closes = Number(period.close.time);
    if (closes < opens) return time >= opens || time < closes;
    return time >= opens && time < closes;
  });
}

// Attach computed openNow to a plain lean object
function withOpenNow(cafe) {
  return { ...cafe, openNow: isOpenNow(cafe.openingHours) };
}

async function listCafes(req, res) {
  const { search = "", city = "", wifi, openNow, page = "1", pageSize = "9" } = req.query;
  const query = {};

  if (search) query.$text = { $search: search };

  if (city) {
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.city = { $regex: `^${escaped}$`, $options: "i" };
  }

  if (wifi === "true") query.wifi = true;

  const currentPage = Math.max(Number(page) || 1, 1);
  const limit = Math.min(Math.max(Number(pageSize) || 9, 1), 24);
  const skip = (currentPage - 1) * limit;

  // FIX: openNow filter — fetch a larger set then filter in JS using the virtual,
  // since openNow is now computed from openingHours at runtime, not stored.
  // We over-fetch when the filter is active and then trim to the requested page size.
  let items, total;

  if (openNow === "true") {
    // Fetch all matching docs (without pagination) so we can filter live openNow
    const all = await Cafe.find(query).sort({ rating: -1, name: 1 }).lean();
    const filtered = all.map(withOpenNow).filter((c) => c.openNow === true);
    total = filtered.length;
    items = filtered.slice(skip, skip + limit);
  } else {
    [items, total] = await Promise.all([
      Cafe.find(query).sort({ rating: -1, name: 1 }).skip(skip).limit(limit).lean(),
      Cafe.countDocuments(query),
    ]);
    items = items.map(withOpenNow);
  }

  res.json({
    items,
    pagination: {
      total,
      page: currentPage,
      pageSize: limit,
      hasMore: skip + items.length < total,
    },
  });
}

async function getCafe(req, res) {
  const cafe = await Cafe.findOne({ id: req.params.id }).lean();
  if (!cafe) return res.status(404).json({ message: "Cafe not found" });
  return res.json(withOpenNow(cafe));
}

async function createCafe(req, res) {
  const cafe = await Cafe.create(normalizeCafePayload(req.body));
  res.status(201).json(cafe.toJSON());
}

async function updateCafe(req, res) {
  const updatedCafe = await Cafe.findOneAndUpdate(
    { id: req.params.id },
    normalizeCafePayload(req.body, { isUpdate: true }),
    { new: true, runValidators: true }
  ).lean();

  if (!updatedCafe) return res.status(404).json({ message: "Cafe not found" });
  return res.json(withOpenNow(updatedCafe));
}

async function deleteCafe(req, res) {
  const deletedCafe = await Cafe.findOneAndDelete({ id: req.params.id }).lean();
  if (!deletedCafe) return res.status(404).json({ message: "Cafe not found" });
  return res.json({ message: "Cafe deleted successfully", cafe: deletedCafe });
}

async function getRecommendations(req, res) {
  const { search = "", city = "" } = req.query;
  const baseQuery = {};

  if (city) {
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    baseQuery.city = { $regex: `^${escaped}$`, $options: "i" };
  }

  if (search) {
    baseQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { area: { $regex: search, $options: "i" } },
      { tags: { $elemMatch: { $regex: search, $options: "i" } } },
    ];
  }

  const cafesForRecommendations = await Cafe.find(baseQuery)
    .sort({ rating: -1 })
    .limit(6)
    .lean();

  // Single bulk query — no N+1
  const cafeIds = cafesForRecommendations.map((c) => c.id);
  const allReviews = await Review.find({ cafeId: { $in: cafeIds } })
    .sort({ createdAt: -1 })
    .lean();

  const reviewsByCafe = allReviews.reduce((map, review) => {
    if (!map[review.cafeId]) map[review.cafeId] = [];
    if (map[review.cafeId].length < 5) map[review.cafeId].push(review);
    return map;
  }, {});

  const recommendations = [];

  for (const cafe of cafesForRecommendations) {
    const cafeWithOpenNow = withOpenNow(cafe);
    const reviews = reviewsByCafe[cafe.id] || [];
    let analysis;

    try {
      analysis = process.env.OPENAI_API_KEY
        ? await fetchOpenAIRecommendation(cafeWithOpenNow, reviews)
        : buildRecommendationFallback(cafeWithOpenNow, reviews, { search, city });
    } catch {
      analysis = buildRecommendationFallback(cafeWithOpenNow, reviews, { search, city });
    }

    recommendations.push({ cafeId: cafe.id, cafeName: cafe.name, ...analysis });
  }

  res.json(recommendations);
}

module.exports = {
  listCafes,
  getCafe,
  createCafe,
  updateCafe,
  deleteCafe,
  getRecommendations,
};
