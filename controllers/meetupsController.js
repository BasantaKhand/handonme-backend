const Meetup = require("../models/Meetup");
const Chat = require("../models/Chat");
const Book = require("../models/Book");
const Message = require("../models/Message");
const SafeSpot = require("../models/SafeSpot");
const { sendSuccess, sendError } = require("../utils/helpers");
const { createNotification } = require("../utils/notify");

// Post a system message into a chat and refresh its preview, then broadcast it.
const postSystemMessage = async (req, chatId, content) => {
  const message = await Message.create({
    chat: chatId,
    sender: req.user.id,
    content,
    messageType: "system",
  });
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: content,
    lastMessageAt: message.createdAt,
  });
  const io = req.app.get("io");
  if (io) io.to(chatId.toString()).emit("newMessage", message);
  return message;
};

const isSameId = (a, b) => a && b && a.toString() === b.toString();

// POST /api/meetups — propose a meetup within a chat.
exports.proposeMeetup = async (req, res) => {
  try {
    const { chatId, date, time, location, safeSpot } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return sendError(res, 404, "Chat not found");

    const participantIds = chat.participants.map((p) => p.toString());
    if (!participantIds.includes(req.user.id)) {
      return sendError(res, 403, "Not a participant of this chat");
    }

    // The other participant is who the meetup is proposed to.
    const proposedTo = participantIds.find((id) => id !== req.user.id);

    const meetup = await Meetup.create({
      chat: chat._id,
      book: chat.book,
      proposedBy: req.user.id,
      proposedTo,
      date,
      time,
      location,
      safeSpot: Boolean(safeSpot),
    });

    const when = new Date(date).toDateString();
    await postSystemMessage(
      req,
      chat._id,
      `Meetup proposed for ${when}${time ? ` at ${time}` : ""} · ${location}`
    );

    createNotification(req.app.get("io"), {
      user: proposedTo,
      type: "meetup_proposed",
      title: "New meetup proposed",
      message: `${when}${time ? ` at ${time}` : ""} · ${location}`,
      link: `/chat?chat=${chat._id}`,
      relatedChat: chat._id,
      relatedMeetup: meetup._id,
    });

    return sendSuccess(res, 201, meetup, "Meetup proposed");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PUT /api/meetups/:id/respond — the recipient confirms or cancels.
exports.respondToMeetup = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["confirm", "cancel"].includes(action)) {
      return sendError(res, 400, "action must be 'confirm' or 'cancel'");
    }

    const meetup = await Meetup.findById(req.params.id);
    if (!meetup) return sendError(res, 404, "Meetup not found");
    if (!isSameId(meetup.proposedTo, req.user.id)) {
      return sendError(res, 403, "Only the recipient can respond");
    }

    meetup.status = action === "confirm" ? "confirmed" : "cancelled";
    await meetup.save();

    await postSystemMessage(
      req,
      meetup.chat,
      action === "confirm"
        ? "Meetup confirmed ✅"
        : "Meetup cancelled ❌"
    );

    if (action === "confirm") {
      createNotification(req.app.get("io"), {
        user: meetup.proposedBy,
        type: "meetup_confirmed",
        title: "Meetup confirmed",
        message: "Your proposed meetup was confirmed.",
        link: `/chat?chat=${meetup.chat}`,
        relatedChat: meetup.chat,
        relatedMeetup: meetup._id,
      });
    }

    return sendSuccess(res, 200, meetup, `Meetup ${meetup.status}`);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PUT /api/meetups/:id/complete — each participant marks the exchange done.
exports.markComplete = async (req, res) => {
  try {
    const meetup = await Meetup.findById(req.params.id);
    if (!meetup) return sendError(res, 404, "Meetup not found");

    const isParticipant =
      isSameId(meetup.proposedBy, req.user.id) ||
      isSameId(meetup.proposedTo, req.user.id);
    if (!isParticipant) {
      return sendError(res, 403, "Not authorized for this meetup");
    }

    // Record this user's completion (idempotent).
    const already = meetup.completedBy.some((u) => isSameId(u, req.user.id));
    if (!already) meetup.completedBy.push(req.user.id);

    const bothDone =
      meetup.completedBy.some((u) => isSameId(u, meetup.proposedBy)) &&
      meetup.completedBy.some((u) => isSameId(u, meetup.proposedTo));

    if (bothDone) {
      meetup.status = "completed";
      if (meetup.book) {
        await Book.findByIdAndUpdate(meetup.book, { status: "Sold" });
      }
    }
    await meetup.save();

    await postSystemMessage(
      req,
      meetup.chat,
      bothDone
        ? "Exchange completed 🎉 — leave a review!"
        : "One party marked the exchange complete. Waiting on the other."
    );

    if (bothDone) {
      const io = req.app.get("io");
      [meetup.proposedBy, meetup.proposedTo].forEach((u) =>
        createNotification(io, {
          user: u,
          type: "exchange_complete",
          title: "Exchange complete 🎉",
          message: "Your exchange is complete. Leave a review!",
          link: `/chat?chat=${meetup.chat}`,
          relatedChat: meetup.chat,
          relatedMeetup: meetup._id,
        })
      );
    }

    return sendSuccess(res, 200, meetup, "Marked complete");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/meetups/chat/:chatId — the latest meetup for a chat (participants only).
exports.getChatMeetup = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return sendError(res, 404, "Chat not found");
    const participantIds = chat.participants.map((p) => p.toString());
    if (!participantIds.includes(req.user.id)) {
      return sendError(res, 403, "Not a participant of this chat");
    }
    const meetup = await Meetup.findOne({ chat: chat._id }).sort({
      createdAt: -1,
    });
    return sendSuccess(res, 200, meetup); // may be null when none proposed yet
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/meetups/safe-spots?city= — suggested safe meetup locations.
exports.getSafeSpots = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = city ? { city } : {};
    const spots = await SafeSpot.find(filter).sort({ city: 1, name: 1 });
    return sendSuccess(res, 200, spots);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
