const express = require("express");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { asyncHandler } = require("../utils/response");
const cafeController = require("../controllers/cafeController");
const { createCafeSchema, updateCafeSchema, cafeQuerySchema } = require("../validators/cafeSchemas");

const router = express.Router();

// Public: anyone can list or view cafes
router.get("/", validate(cafeQuerySchema, "query"), asyncHandler(cafeController.listCafes));
router.get("/:id", asyncHandler(cafeController.getCafe));

// FIX: Write routes now require auth AND admin role
router.post(
  "/",
  authMiddleware,
  adminOnly,
  validate(createCafeSchema),
  asyncHandler(cafeController.createCafe)
);
router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  validate(updateCafeSchema),
  asyncHandler(cafeController.updateCafe)
);
router.delete("/:id", authMiddleware, adminOnly, asyncHandler(cafeController.deleteCafe));

module.exports = router;
