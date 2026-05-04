const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cafeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
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

reviewSchema.index({ userId: 1, cafeId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
