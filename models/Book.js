const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    edition: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    condition: {
      type: String,
      enum: ["Like New", "Good", "Fair", "Worn"],
      required: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    exchangeType: {
      type: String,
      enum: ["Cash", "Swap", "Both", "Free"],
      default: "Cash",
    },
    photos: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: "",
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Sold"],
      default: "Available",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
