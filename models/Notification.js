const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "new_message",
        "meetup_proposed",
        "meetup_confirmed",
        "exchange_complete",
        "new_review",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    // Where the client should navigate when the notification is opened.
    link: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    relatedMeetup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meetup",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
