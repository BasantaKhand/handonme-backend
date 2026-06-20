const express = require("express");
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, chatController.getChats);
router.post("/", protect, chatController.createChat);
router.get("/:chatId/messages", protect, chatController.getMessages);
router.post("/:chatId/messages", protect, chatController.sendMessage);

module.exports = router;
