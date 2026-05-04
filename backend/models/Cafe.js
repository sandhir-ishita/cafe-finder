const mongoose = require("mongoose");

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
    openNow: {
      type: Boolean,
      default: false,
    },
    location: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
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
  }
);

cafeSchema.index({ name: "text", area: "text", city: "text", tags: "text" });

module.exports = mongoose.model("Cafe", cafeSchema);
