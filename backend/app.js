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

// FIX: Support comma-separated list of allowed origins so staging + prod
// frontend URLs can both be whitelisted without code changes.
// e.g. FRONTEND_URL=https://mycafe.com,https://staging.mycafe.com
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function createApp({ mongooseInstance }) {
  const app = express();
  app.locals.mongoose = mongooseInstance;

  app.use(helmet());

  // FIX: Dynamic origin check + credentials: true for future cookie/session auth
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server requests (no origin header)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", status);

  app.use("/api/auth", authLimiter);
  app.use("/api", apiLimiter);

  app.get(
    "/api/recommendations",
    require("./utils/response").asyncHandler(
      require("./controllers/cafeController").getRecommendations
    )
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/cafes", cafeRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/maps", mapRoutes);

  // Global error handler
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    // FIX: Never expose internal error details in production
    const isDev = process.env.NODE_ENV !== "production";
    res.status(statusCode).json({
      message: err.message || "Internal server error",
      ...(isDev && statusCode >= 500 ? { error: formatValidationError(err) } : {}),
    });
  });

  return app;
}

module.exports = createApp;
