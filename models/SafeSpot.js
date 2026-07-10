const mongoose = require("mongoose");

const safeSpotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["library", "campus", "cafe", "public"],
      default: "public",
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SafeSpot", safeSpotSchema);
