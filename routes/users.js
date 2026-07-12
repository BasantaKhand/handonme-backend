const express = require("express");
const userController = require("../controllers/userController");
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Specific routes must come before the "/:id" param route.
router.get("/dashboard", protect, dashboardController.getDashboardStats);
router.get("/exchanges", protect, dashboardController.getExchangeHistory);
router.get("/wishlist", protect, dashboardController.getWishlist);
router.post("/wishlist/:bookId", protect, dashboardController.addToWishlist);
router.delete("/wishlist/:bookId", protect, dashboardController.removeFromWishlist);

router.put("/profile", protect, userController.updateProfile);
router.get("/:id", userController.getUserById);

module.exports = router;
