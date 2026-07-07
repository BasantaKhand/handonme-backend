const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Distinguishes plain chat from structured offers/meetup proposals/system.
    messageType: {
      type: String,
      enum: ["text", "offer", "meetup_proposal", "system"],
      default: "text",
    },
    // Present when messageType === "offer" (a counter-offer amount).
    offer: {
      amount: { type: Number },
    },
    // Present when messageType === "meetup_proposal".
    meetup: {
      date: { type: Date },
      time: { type: String },
      location: { type: String },
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
