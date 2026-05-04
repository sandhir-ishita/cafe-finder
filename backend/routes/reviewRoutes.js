const express = require("express");
const authMiddleware = require("../middleware/auth");
const validate = require("../middleware/validate");
const { asyncHandler } = require("../utils/response");
const reviewController = require("../controllers/reviewController");
const { createReviewSchema } = require("../validators/reviewSchemas");

const router = express.Router();

router.get("/cafe/:cafeId", asyncHandler(reviewController.listReviews));
router.post("/", authMiddleware, validate(createReviewSchema), asyncHandler(reviewController.createReview));

module.exports = router;
