const mongoose = require("mongoose");
const dotenv = require("dotenv");
const createApp = require("./app");
const Cafe = require("./models/Cafe");
const seedCafes = require("./data/cafes");

dotenv.config();

// Fail fast: crash immediately if critical env vars are missing.
// Without this, the server boots fine but randomly explodes on first auth request.
const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET"];
for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

async function seedCafeCollection() {
  await Promise.all(
    seedCafes.map((cafe) =>
      Cafe.findOneAndUpdate({ id: cafe.id }, cafe, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
    )
  );

  return Cafe.countDocuments();
}

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas connected");

    const totalCafes = await seedCafeCollection();
    console.log(`Cafe collection ready with ${totalCafes} record(s)`);

    const app = createApp({ mongooseInstance: mongoose });
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

startServer();
