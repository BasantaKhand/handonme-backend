const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { sendSuccess, sendError } = require("../utils/helpers");
const { createNotification } = require("../utils/notify");

const PARTICIPANT_FIELDS = "name avatar isVerified rating";
const BOOK_FIELDS = "title price photos";

// True if the given user id is one of the chat's participants.
const isParticipant = (chat, userId) =>
  chat.participants.some((p) => {
    const id = p._id ? p._id.toString() : p.toString();
    return id === userId;
  });

// Build a short preview string for the chat list from a message.
const previewFor = (message) => {
  if (message.messageType === "offer") {
    return `💰 Offer: Rs. ${message.offer?.amount ?? ""}`.trim();
  }
  if (message.messageType === "meetup_proposal") {
    return "📍 Meetup proposal";
  }
  return message.content;
};

// GET /api/chats — all chats for the authenticated user, newest activity first.
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate("participants", PARTICIPANT_FIELDS)
      .populate("book", BOOK_FIELDS)
      .sort({ lastMessageAt: -1, updatedAt: -1 });
    return sendSuccess(res, 200, chats);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/chats/:id — a single chat (participants only).
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("participants", PARTICIPANT_FIELDS)
      .populate("book", BOOK_FIELDS);
    if (!chat) return sendError(res, 404, "Chat not found");
    if (!isParticipant(chat, req.user.id)) {
      return sendError(res, 403, "Not authorized to view this chat");
    }
    return sendSuccess(res, 200, chat);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// POST /api/chats — create a chat for a book, or return the existing one.
exports.createChat = async (req, res) => {
  try {
    const { bookId, sellerId } = req.body;
    if (!sellerId) return sendError(res, 400, "sellerId is required");

    const participants = [req.user.id, sellerId];

    let chat = await Chat.findOne({
      participants: { $all: participants },
      book: bookId,
    });

    if (chat) {
      await chat.populate("participants", PARTICIPANT_FIELDS);
      await chat.populate("book", BOOK_FIELDS);
      return sendSuccess(res, 200, chat, "Existing chat");
    }

    chat = await Chat.create({ participants, book: bookId });
    await chat.populate("participants", PARTICIPANT_FIELDS);
    await chat.populate("book", BOOK_FIELDS);
    return sendSuccess(res, 201, chat, "Chat created");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/chats/:id/messages — messages for a chat; marks incoming as read.
exports.getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return sendError(res, 404, "Chat not found");
    if (!isParticipant(chat, req.user.id)) {
      return sendError(res, 403, "Not authorized to view these messages");
    }

    // Mark messages sent by the other participant as read.
    await Message.updateMany(
      { chat: chat._id, sender: { $ne: req.user.id }, read: false },
      { read: true }
    );

    const messages = await Message.find({ chat: chat._id })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    return sendSuccess(res, 200, messages);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// POST /api/chats/:id/messages — send a message and broadcast it.
exports.sendMessage = async (req, res) => {
  try {
    const { content, messageType, offer, meetup } = req.body;

    const chat = await Chat.findById(req.params.id);
    if (!chat) return sendError(res, 404, "Chat not found");
    if (!isParticipant(chat, req.user.id)) {
      return sendError(res, 403, "Not authorized to post in this chat");
    }

    let message = await Message.create({
      chat: chat._id,
      sender: req.user.id,
      content,
      messageType: messageType || "text",
      offer,
      meetup,
    });

    // Refresh the chat's preview + activity timestamp.
    chat.lastMessage = previewFor(message);
    chat.lastMessageAt = message.createdAt;
    await chat.save();

    message = await message.populate("sender", "name avatar");

    // Broadcast to everyone currently in the chat room.
    const io = req.app.get("io");
    if (io) {
      io.to(chat._id.toString()).emit("newMessage", message);
    }

    // Notify the other participant(s) about the new message.
    const senderName = message.sender?.name || "Someone";
    chat.participants
      .filter((p) => p.toString() !== req.user.id)
      .forEach((recipient) =>
        createNotification(io, {
          user: recipient,
          type: "new_message",
          title: `New message from ${senderName}`,
          message: previewFor(message),
          link: `/chat?chat=${chat._id}`,
          relatedChat: chat._id,
        })
      );

    return sendSuccess(res, 201, message, "Message sent");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};



