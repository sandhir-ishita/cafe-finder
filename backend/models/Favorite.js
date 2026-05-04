const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
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
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

favoriteSchema.index({ userId: 1, cafeId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
