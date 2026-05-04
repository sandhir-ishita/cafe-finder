const express = require("express");
const validate = require("../middleware/validate");
const { asyncHandler } = require("../utils/response");
const cafeController = require("../controllers/cafeController");
const { createCafeSchema, updateCafeSchema, cafeQuerySchema } = require("../validators/cafeSchemas");

const router = express.Router();

router.get("/", validate(cafeQuerySchema, "query"), asyncHandler(cafeController.listCafes));
router.get("/:id", asyncHandler(cafeController.getCafe));
router.post("/", validate(createCafeSchema), asyncHandler(cafeController.createCafe));
router.put("/:id", validate(updateCafeSchema), asyncHandler(cafeController.updateCafe));
router.delete("/:id", asyncHandler(cafeController.deleteCafe));

module.exports = router;
