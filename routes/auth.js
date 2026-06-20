const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  authController.register
);

router.post(
  "/verify",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").notEmpty().withMessage("OTP is required"),
  ],
  authController.verifyOTP
);

router.post(
  "/resend-otp",
  [body("email").isEmail().withMessage("Valid email is required")],
  authController.resendOTP
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

router.get("/me", protect, authController.getMe);

module.exports = router;
