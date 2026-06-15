const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { sendSuccess, sendError } = require("../utils/helpers");

// Get all chats for the authenticated user.
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate("participants", "name avatar")
      .populate("book", "title")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    return sendSuccess(res, 200, chats);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Create a chat or return an existing one between two participants for a book.
exports.createChat = async (req, res) => {
  try {
    const { recipientId, bookId } = req.body;
    const participants = [req.user.id, recipientId];

    let chat = await Chat.findOne({
      participants: { $all: participants },
      book: bookId,
    });

    if (!chat) {
      chat = await Chat.create({ participants, book: bookId });
    }
    return sendSuccess(res, 201, chat, "Chat ready");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get all messages in a chat.
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });
    return sendSuccess(res, 200, messages);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Persist a new message and update the chat's last message.
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.create({
      chat: req.params.chatId,
      sender: req.user.id,
      content,
    });
    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: message._id,
    });
    return sendSuccess(res, 201, message, "Message sent");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
