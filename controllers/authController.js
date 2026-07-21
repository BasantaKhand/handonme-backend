const { validationResult } = require("express-validator");
const User = require("../models/User");
const { generateToken, sendSuccess, sendError } = require("../utils/helpers");
const { sendOTPEmail } = require("../utils/email");

// Generate a 6-digit numeric OTP as a string.
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// OTP validity window: 10 minutes from now.
const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

// Log the OTP to the console for testing/visibility.
const logOTP = (email, otp) => {
  console.log(`========== OTP for ${email}: ${otp} ==========`);
};

// Deliver the OTP: always log it, then attempt to send a real email. Email
// failures are logged but never break the flow (registration still succeeds).
const deliverOTP = async (email, otp) => {
  logOTP(email, otp);
  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}: ${error.message}`);
  }
};

// Shape the user object returned to clients.
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  location: user.location,
  avatar: user.avatar,
  isVerified: user.isVerified,
  verificationBadge: user.verificationBadge,
  rating: user.rating,
  totalExchanges: user.totalExchanges,
});

// Register a new user and issue an OTP for email verification.
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

    const otp = generateOTP();

    // Password is hashed by the User model's pre-save hook (bcrypt, 10 rounds).
    const user = await User.create({
      name,
      email,
      password,
      location,
      otp,
      otpExpires: otpExpiry(),
    });

    await deliverOTP(user.email, otp);

    return sendSuccess(
      res,
      201,
      { email: user.email },
      "Registration successful. Please verify the OTP sent to your email."
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Verify the OTP, mark the account verified, and return an auth token.
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otp +otpExpires");
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (!user.otp || user.otp !== otp) {
      return sendError(res, 400, "Invalid OTP");
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return sendError(res, 400, "OTP has expired");
    }

    user.isVerified = true;
    user.verificationBadge = "Email";
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    return sendSuccess(
      res,
      200,
      { token, user: publicUser(user) },
      "Account verified successfully"
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Issue a fresh OTP for an unverified account.
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.isVerified) {
      return sendError(res, 400, "Account is already verified");
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = otpExpiry();
    await user.save();
    await deliverOTP(user.email, otp);

    return sendSuccess(
      res,
      200,
      { email: user.email },
      "A new OTP has been sent to your email."
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Authenticate a user. Unverified accounts get a fresh OTP instead of a token.
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

    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = otpExpiry();
      await user.save();
      await deliverOTP(user.email, otp);

      return res.status(403).json({
        success: false,
        needsVerification: true,
        email: user.email,
        message: "Account not verified. A new OTP has been sent to your email.",
      });
    }

    const token = generateToken(user._id);
    return sendSuccess(
      res,
      200,
      { token, user: publicUser(user) },
      "Login successful"
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Return the currently authenticated user (attached by protect middleware).
exports.getMe = async (req, res) => {
  try {
    return sendSuccess(res, 200, publicUser(req.user));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
