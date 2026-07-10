const Review = require("../models/Review");
const Meetup = require("../models/Meetup");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/helpers");

// POST /api/reviews — review the other party after a completed meetup.
exports.createReview = async (req, res) => {
  try {
    const { reviewedUser, rating, comment, meetupId } = req.body;

    const meetup = await Meetup.findById(meetupId);
    if (!meetup) return sendError(res, 404, "Meetup not found");
    if (meetup.status !== "completed") {
      return sendError(res, 400, "You can only review a completed exchange");
    }

    // One review per reviewer per user per meetup.
    const existing = await Review.findOne({
      reviewer: req.user.id,
      reviewee: reviewedUser,
      meetup: meetupId,
    });
    if (existing) {
      return sendError(res, 400, "You already reviewed this exchange");
    }

    const review = await Review.create({
      reviewer: req.user.id,
      reviewee: reviewedUser,
      book: meetup.book,
      meetup: meetupId,
      rating,
      comment,
    });

    // Recalculate the reviewee's average rating.
    const reviews = await Review.find({ reviewee: reviewedUser });
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

    // Count completed exchanges the reviewee took part in.
    const totalExchanges = await Meetup.countDocuments({
      status: "completed",
      $or: [{ proposedBy: reviewedUser }, { proposedTo: reviewedUser }],
    });

    await User.findByIdAndUpdate(reviewedUser, {
      rating: Math.round(avg * 10) / 10,
      totalExchanges,
    });

    return sendSuccess(res, 201, review, "Review submitted");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/reviews/user/:userId — all reviews written about a user.
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, reviews);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
