const mongoose = require("mongoose");

const meetupSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    // True when the location was chosen from the suggested safe spots.
    safeSpot: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["proposed", "confirmed", "completed", "cancelled"],
      default: "proposed",
    },
    // Users who have marked the exchange complete (both required to finish).
    completedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meetup", meetupSchema);
