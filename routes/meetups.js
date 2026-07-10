const express = require("express");
const meetupsController = require("../controllers/meetupsController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Static path must be declared before any "/:id" routes.
router.get("/safe-spots", meetupsController.getSafeSpots);

router.post("/", protect, meetupsController.proposeMeetup);
router.put("/:id/respond", protect, meetupsController.respondToMeetup);
router.put("/:id/complete", protect, meetupsController.markComplete);

module.exports = router;
