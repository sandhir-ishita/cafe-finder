const express = require("express");
const authMiddleware = require("../middleware/auth");
const validate = require("../middleware/validate");
const { asyncHandler } = require("../utils/response");
const favoriteController = require("../controllers/favoriteController");
const { createFavoriteSchema } = require("../validators/favoriteSchemas");

const router = express.Router();

router.post("/", authMiddleware, validate(createFavoriteSchema), asyncHandler(favoriteController.addFavorite));
router.get("/:userId", authMiddleware, asyncHandler(favoriteController.getFavorites));
router.delete("/:id", authMiddleware, asyncHandler(favoriteController.removeFavorite));

module.exports = router;
