const Review = require("../models/Review");
const User = require("../models/User");

async function listReviews(req, res) {
  const reviews = await Review.find({ cafeId: req.params.cafeId }).sort({ createdAt: -1 }).lean();
  res.json(reviews);
}

async function createReview(req, res) {
  const { cafeId, rating, text } = req.body;
  const existingReview = await Review.findOne({ userId: req.user.id, cafeId });

  if (existingReview) {
    return res.status(409).json({ message: "You have already reviewed this cafe." });
  }

  const user = await User.findById(req.user.id).lean();
  const review = await Review.create({
    userId: req.user.id,
    cafeId,
    authorName: user?.name || "Anonymous",
    rating,
    text,
  });

  return res.status(201).json(review);
}

module.exports = {
  listReviews,
  createReview,
};
