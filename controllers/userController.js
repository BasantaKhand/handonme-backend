const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/helpers");

// Get a public user profile by id.
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update the authenticated user's profile.
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "location", "avatar"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, user, "Profile updated");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
