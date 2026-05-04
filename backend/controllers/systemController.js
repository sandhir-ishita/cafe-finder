const Cafe = require("../models/Cafe");

async function status(req, res) {
  const totalCafes = await Cafe.countDocuments().catch(() => 0);
  res.json({
    status: "ok",
    message: "Backend running...",
    database: req.app.locals.mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    totalCafes,
  });
}

module.exports = {
  status,
};
