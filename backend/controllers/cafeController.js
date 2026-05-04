const Cafe = require("../models/Cafe");
const Review = require("../models/Review");
const { normalizeCafePayload } = require("../utils/cafeHelpers");
const { buildRecommendationFallback, fetchOpenAIRecommendation } = require("../services/recommendationService");

async function listCafes(req, res) {
  const { search = "", city = "", wifi, openNow, page = "1", pageSize = "9" } = req.query;
  const query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (city) {
    query.city = { $regex: `^${city}$`, $options: "i" };
  }

  if (wifi === "true") {
    query.wifi = true;
  }

  if (openNow === "true") {
    query.openNow = true;
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const limit = Math.min(Math.max(Number(pageSize) || 9, 1), 24);
  const skip = (currentPage - 1) * limit;

  const [items, total] = await Promise.all([
    Cafe.find(query).sort({ rating: -1, name: 1 }).skip(skip).limit(limit).lean(),
    Cafe.countDocuments(query),
  ]);

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

  if (!cafe) {
    return res.status(404).json({ message: "Cafe not found" });
  }

  return res.json(cafe);
}

async function createCafe(req, res) {
  const cafe = await Cafe.create(normalizeCafePayload(req.body));
  res.status(201).json(cafe);
}

async function updateCafe(req, res) {
  const updatedCafe = await Cafe.findOneAndUpdate(
    { id: req.params.id },
    normalizeCafePayload(req.body, { isUpdate: true }),
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!updatedCafe) {
    return res.status(404).json({ message: "Cafe not found" });
  }

  return res.json(updatedCafe);
}

async function deleteCafe(req, res) {
  const deletedCafe = await Cafe.findOneAndDelete({ id: req.params.id }).lean();

  if (!deletedCafe) {
    return res.status(404).json({ message: "Cafe not found" });
  }

  return res.json({
    message: "Cafe deleted successfully",
    cafe: deletedCafe,
  });
}

async function getRecommendations(req, res) {
  const { search = "", city = "" } = req.query;
  const baseQuery = {};

  if (city) {
    baseQuery.city = { $regex: `^${city}$`, $options: "i" };
  }

  if (search) {
    baseQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { area: { $regex: search, $options: "i" } },
      { tags: { $elemMatch: { $regex: search, $options: "i" } } },
    ];
  }

  const cafesForRecommendations = await Cafe.find(baseQuery).sort({ rating: -1 }).limit(6).lean();
  const recommendations = [];

  for (const cafe of cafesForRecommendations) {
    const reviews = await Review.find({ cafeId: cafe.id }).sort({ createdAt: -1 }).limit(5).lean();
    let analysis;

    try {
      analysis = process.env.OPENAI_API_KEY
        ? await fetchOpenAIRecommendation(cafe, reviews)
        : buildRecommendationFallback(cafe, reviews, { search, city });
    } catch {
      analysis = buildRecommendationFallback(cafe, reviews, { search, city });
    }

    recommendations.push({
      cafeId: cafe.id,
      cafeName: cafe.name,
      ...analysis,
    });
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
