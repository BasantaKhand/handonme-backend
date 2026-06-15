const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a given user id.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Standard success response wrapper.
 */
const sendSuccess = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * Standard error response wrapper.
 */
const sendError = (res, statusCode, message = "Something went wrong") => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { generateToken, sendSuccess, sendError };
