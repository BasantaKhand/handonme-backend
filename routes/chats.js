const express = require("express");
const chatsController = require("../controllers/chatsController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, chatsController.getMyChats);
router.get("/unread-count", protect, chatsController.getUnreadCount);
router.post("/", protect, chatsController.createChat);
router.get("/:id", protect, chatsController.getChatById);
router.get("/:id/messages", protect, chatsController.getMessages);
router.post("/:id/messages", protect, chatsController.sendMessage);

module.exports = router;
