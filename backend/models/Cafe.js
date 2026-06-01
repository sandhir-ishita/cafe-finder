const mongoose = require("mongoose");

// Opening hours period schema — mirrors Google Places API format.
// Each period has an open and close object with day (0=Sun–6=Sat) and time ("HHMM").
const periodSchema = new mongoose.Schema(
  {
    open: {
      day: { type: Number, required: true },   // 0 (Sun) – 6 (Sat)
      time: { type: String, required: true },  // "0800", "2200", etc.
    },
    close: {
      day: { type: Number, required: true },
      time: { type: String, required: true },
    },
  },
  { _id: false }
);

const cafeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    priceLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    wifi: {
      type: Boolean,
      default: false,
    },
    powerSockets: {
      type: Boolean,
      default: false,
    },
    // FIX: openNow is now a computed virtual — it is no longer stored in the DB.
    // openingHours stores the structured schedule from Google Places so we can
    // compute the real open/closed state at query time instead of freezing it
    // at import time (which went stale immediately).
    openingHours: {
      type: [periodSchema],
      default: [],
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    source: {
      type: String,
      default: "manual",
      trim: true,
    },
    googlePlaceId: {
      type: String,
      default: null,
      index: true,
    },
    googleMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: compute openNow from openingHours at the moment the document is serialised.
// Returns true/false when hours are known, null when no hours are stored.
cafeSchema.virtual("openNow").get(function () {
  if (!this.openingHours || this.openingHours.length === 0) return null;

  const now = new Date();
  const day = now.getDay();                              // 0 Sun – 6 Sat
  const time = now.getHours() * 100 + now.getMinutes(); // e.g. 1430 for 2:30 PM

  return this.openingHours.some((period) => {
    if (period.open.day !== day) return false;
    const opens = Number(period.open.time);
    const closes = Number(period.close.time);

    // Handle overnight periods (e.g. open 2200, close 0200 next day)
    if (closes < opens) {
      return time >= opens || time < closes;
    }
    return time >= opens && time < closes;
  });
});

cafeSchema.index({ name: "text", area: "text", city: "text", tags: "text" });

module.exports = mongoose.model("Cafe", cafeSchema);
