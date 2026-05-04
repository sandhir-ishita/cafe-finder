const express = require("express");
const { asyncHandler } = require("../utils/response");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.post("/", asyncHandler(chatController.handleChat));

module.exports = router;
