const express = require("express");
const validate = require("../middleware/validate");
const { asyncHandler } = require("../utils/response");
const authController = require("../controllers/authController");
const { registerSchema, loginSchema } = require("../validators/authSchemas");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));

module.exports = router;
