const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Book = require("../models/Book");

let counter = 0;

// Create a verified user and a valid JWT for them.
async function createUser(overrides = {}) {
  counter += 1;
  const user = await User.create({
    name: overrides.name || `User ${counter}`,
    email: overrides.email || `user${counter}@example.com`,
    password: overrides.password || "password123",
    location: overrides.location || "Kathmandu",
    isVerified: overrides.isVerified ?? true,
    verificationBadge: overrides.verificationBadge || "Email",
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return { user, token };
}

// Create a book owned by the given seller.
async function createBook(sellerId, overrides = {}) {
  return Book.create({
    title: overrides.title || "Sample Book",
    author: overrides.author || "Sample Author",
    subject: overrides.subject || "Science",
    condition: overrides.condition || "Good",
    price: overrides.price ?? 500,
    exchangeType: overrides.exchangeType || "Cash",
    location: overrides.location || "Kathmandu",
    seller: sellerId,
    ...overrides,
  });
}

module.exports = { createUser, createBook };
