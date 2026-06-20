const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:id", userController.getUserById);
router.put("/profile", protect, userController.updateProfile);

module.exports = router;
