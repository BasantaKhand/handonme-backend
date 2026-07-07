const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // Exactly two users take part in a conversation.
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // The book the conversation is about.
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    // Preview text of the most recent message (for chat list rendering).
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
