const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const cafeRoutes = require("./routes/cafeRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const mapRoutes = require("./routes/mapRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { status } = require("./controllers/systemController");
const { formatValidationError } = require("./utils/response");

// Brute-force protection: max 20 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again in 15 minutes." },
});

// General API rate limit: max 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
});

function createApp({ mongooseInstance }) {
  const app = express();
  app.locals.mongoose = mongooseInstance;

  // Security headers — sets X-Content-Type-Options, Strict-Transport-Security, etc.
  app.use(helmet());

  app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
  app.use(express.json());

  // HTTP request logging: 'dev' format in development, 'combined' (Apache-style) in production
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", status);

  // Apply limiters before routes
  app.use("/api/auth", authLimiter);
  app.use("/api", apiLimiter);

  app.get("/api/recommendations", require("./utils/response").asyncHandler(require("./controllers/cafeController").getRecommendations));
  app.use("/api/auth", authRoutes);
  app.use("/api/cafes", cafeRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/maps", mapRoutes);

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: err.message || "Internal server error",
      error: statusCode >= 500 ? formatValidationError(err) : undefined,
    });
  });

  return app;
}

module.exports = createApp;
