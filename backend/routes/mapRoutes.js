const express = require("express");
const validate = require("../middleware/validate");
const { asyncHandler } = require("../utils/response");
const mapsController = require("../controllers/mapsController");
const { importCafeSchema, directionsQuerySchema, placesQuerySchema } = require("../validators/mapsSchemas");

const router = express.Router();

router.get("/places", validate(placesQuerySchema, "query"), asyncHandler(mapsController.searchPlaces));
router.post("/import-cafes", validate(importCafeSchema), asyncHandler(mapsController.importCafes));
router.get("/directions", validate(directionsQuerySchema, "query"), asyncHandler(mapsController.directions));

module.exports = router;
