const Notification = require("../models/Notification");

/**
 * Create a notification for a user. Failures are swallowed so notification
 * problems never break the main request flow. Optionally emits a socket event
 * to the recipient's personal room ("user:<id>") when an io instance is given.
 */
async function createNotification(io, payload) {
  try {
    const notification = await Notification.create(payload);
    if (io && payload.user) {
      io.to(`user:${payload.user.toString()}`).emit(
        "notification",
        notification
      );
    }
    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
}

module.exports = { createNotification };
