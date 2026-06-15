const express = require("express");
const reviewController = require("../controllers/reviewController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, reviewController.createReview);
router.get("/user/:userId", reviewController.getReviewsForUser);

module.exports = router;
