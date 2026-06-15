const { validationResult } = require("express-validator");
const User = require("../models/User");
const { generateToken, sendSuccess, sendError } = require("../utils/helpers");

// Register a new user.
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, location } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 400, "User with this email already exists");
    }

    const user = await User.create({ name, email, password, location });
    const token = generateToken(user._id);

    return sendSuccess(
      res,
      201,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
        },
      },
      "Registration successful"
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Authenticate a user and return a token.
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, 401, "Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid credentials");
    }

    const token = generateToken(user._id);
    return sendSuccess(
      res,
      200,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
        },
      },
      "Login successful"
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Return the currently authenticated user.
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
