const Review = require("../models/Review");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/helpers");

// Create a review for a user and recalculate their average rating.
exports.createReview = async (req, res) => {
  try {
    const { reviewee, book, rating, comment } = req.body;
    const review = await Review.create({
      reviewer: req.user.id,
      reviewee,
      book,
      rating,
      comment,
    });

    // Recalculate the reviewee's average rating.
    const reviews = await Review.find({ reviewee });
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
    await User.findByIdAndUpdate(reviewee, { rating: avg });

    return sendSuccess(res, 201, review, "Review submitted");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get all reviews for a specific user.
exports.getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, reviews);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
