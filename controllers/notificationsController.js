const Notification = require("../models/Notification");
const { sendSuccess, sendError } = require("../utils/helpers");

// GET /api/notifications — the current user's notifications, newest first.
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    const unreadCount = notifications.filter((n) => !n.read).length;
    return sendSuccess(res, 200, { notifications, unreadCount });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PUT /api/notifications/:id/read — mark a single notification read.
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return sendError(res, 404, "Notification not found");
    return sendSuccess(res, 200, notification, "Marked as read");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PUT /api/notifications/read-all — mark all of the user's notifications read.
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    return sendSuccess(res, 200, null, "All notifications marked as read");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
