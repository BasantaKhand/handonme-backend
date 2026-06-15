const express = require("express");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:id", userController.getUserById);
router.put("/profile", auth, userController.updateProfile);

module.exports = router;
