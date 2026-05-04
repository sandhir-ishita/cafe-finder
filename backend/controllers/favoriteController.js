const Favorite = require("../models/Favorite");
const Cafe = require("../models/Cafe");

async function addFavorite(req, res) {
  const { cafeId } = req.body;
  const cafe = await Cafe.findOne({ id: cafeId });

  if (!cafe) {
    return res.status(404).json({ message: "Cafe not found" });
  }

  const favorite = await Favorite.findOneAndUpdate(
    { userId: req.user.id, cafeId },
    { userId: req.user.id, cafeId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return res.status(201).json(favorite);
}

async function getFavorites(req, res) {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ message: "You can only view your own favorites" });
  }

  const favorites = await Favorite.find({ userId: req.params.userId }).lean();
  const cafes = await Cafe.find({ id: { $in: favorites.map((favorite) => favorite.cafeId) } })
    .sort({ rating: -1, name: 1 })
    .lean();

  res.json(
    cafes.map((cafe) => {
      const favorite = favorites.find((item) => item.cafeId === cafe.id);
      return {
        ...cafe,
        favoriteId: favorite?._id,
      };
    })
  );
}

async function removeFavorite(req, res) {
  const favorite = await Favorite.findById(req.params.id);

  if (!favorite) {
    return res.status(404).json({ message: "Favorite not found" });
  }

  if (favorite.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own favorites" });
  }

  await favorite.deleteOne();
  return res.json({ message: "Favorite removed" });
}

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
};
