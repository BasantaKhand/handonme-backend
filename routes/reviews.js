const express = require("express");
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, reviewController.createReview);
router.get("/user/:userId", reviewController.getReviewsForUser);

module.exports = router;
