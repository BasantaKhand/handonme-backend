const express = require("express");
const chatController = require("../controllers/chatController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, chatController.getChats);
router.post("/", auth, chatController.createChat);
router.get("/:chatId/messages", auth, chatController.getMessages);
router.post("/:chatId/messages", auth, chatController.sendMessage);

module.exports = router;
