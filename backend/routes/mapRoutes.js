const express = require("express");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { asyncHandler } = require("../utils/response");
const mapsController = require("../controllers/mapsController");
const {
  importCafeSchema,
  directionsQuerySchema,
  placesQuerySchema,
} = require("../validators/mapsSchemas");

const router = express.Router();

// Public: anyone can search places or get directions
router.get(
  "/places",
  validate(placesQuerySchema, "query"),
  asyncHandler(mapsController.searchPlaces)
);
router.get(
  "/directions",
  validate(directionsQuerySchema, "query"),
  asyncHandler(mapsController.directions)
);

// FIX: Import route now requires auth + admin — prevents anonymous API/DB abuse
router.post(
  "/import-cafes",
  authMiddleware,
  adminOnly,
  validate(importCafeSchema),
  asyncHandler(mapsController.importCafes)
);

// Photo proxy — serves Google Place photos without exposing the API key to the browser
router.get("/photo", asyncHandler(mapsController.proxyPhoto));

module.exports = router;
