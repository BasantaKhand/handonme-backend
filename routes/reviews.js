const express = require("express");
const reviewsController = require("../controllers/reviewsController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, reviewsController.createReview);
router.get("/user/:userId", reviewsController.getUserReviews);

module.exports = router;
