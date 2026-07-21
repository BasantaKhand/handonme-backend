const nodemailer = require("nodemailer");

// HandOnMe brand accent color used across email templates.
const BRAND_GREEN = "#2e7d32";

// Lazily create a single reusable Gmail SMTP transporter. Returns null when
// email credentials are not configured so callers can degrade gracefully.
let cachedTransporter;
function getTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "Email credentials (EMAIL_USER/EMAIL_PASS) are not set. Emails will not be sent."
    );
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS on port 587
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return cachedTransporter;
}

// Build the HTML body for an OTP verification email.
const otpHtml = (otp) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
    <h1 style="color: ${BRAND_GREEN}; font-size: 24px; margin-bottom: 8px;">HandOnMe</h1>
    <p style="font-size: 16px; margin: 16px 0;">Use the verification code below to complete your sign-up:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: ${BRAND_GREEN}; background: #f1f8f1; padding: 16px 24px; border-radius: 8px;">${otp}</span>
    </div>
    <p style="font-size: 14px; color: #555;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999;">&copy; HandOnMe</p>
  </div>
`;

// Plain text fallback for clients that don't render HTML.
const otpText = (otp) =>
  `HandOnMe\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't request it, you can safely ignore this email.`;

/**
 * Send an OTP verification email. Throws on failure so callers can decide how
 * to handle delivery errors (registration still succeeds even if this fails).
 */
async function sendOTPEmail(to, otp) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email transporter is not configured");
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  return transporter.sendMail({
    from,
    to,
    subject: "HandOnMe - Your Verification Code",
    text: otpText(otp),
    html: otpHtml(otp),
  });
}

module.exports = { sendOTPEmail };
