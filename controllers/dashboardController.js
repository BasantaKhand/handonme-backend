const User = require("../models/User");
const Book = require("../models/Book");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Meetup = require("../models/Meetup");
const Review = require("../models/Review");
const { sendSuccess, sendError } = require("../utils/helpers");

const idStr = (v) => (v && v._id ? v._id.toString() : String(v));

// Rough savings vs a new copy (used books ≈ 40% of new price).
const estimateSavings = (price) =>
  price > 0 ? Math.round(price / 0.4 - price) : 0;

// GET /api/users/dashboard — headline stats for the current user.
exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user.id;

    const [user, activeListings, totalListings, chatIds, completedMeetups] =
      await Promise.all([
        User.findById(uid),
        Book.countDocuments({ seller: uid, status: "Available" }),
        Book.countDocuments({ seller: uid }),
        Chat.find({ participants: uid }).distinct("_id"),
        Meetup.find({
          status: "completed",
          $or: [{ proposedBy: uid }, { proposedTo: uid }],
        }).populate("book", "price seller"),
      ]);

    if (!user) return sendError(res, 404, "User not found");

    const totalExchanges = completedMeetups.length;

    // Savings counted only for exchanges where the user was the buyer.
    const totalSaved = completedMeetups.reduce((sum, m) => {
      const book = m.book;
      if (book && idStr(book.seller) !== uid) {
        return sum + estimateSavings(book.price || 0);
      }
      return sum;
    }, 0);

    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: uid },
      read: false,
    });

    const recentChats = await Chat.find({ participants: uid })
      .populate("participants", "name avatar")
      .populate("book", "title")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(3);

    const recentMessages = recentChats.map((c) => ({
      chatId: c._id,
      preview: typeof c.lastMessage === "string" ? c.lastMessage : "",
      lastMessageAt: c.lastMessageAt,
      other: c.participants.find((p) => idStr(p) !== uid) || c.participants[0],
      book: c.book,
    }));

    return sendSuccess(res, 200, {
      totalExchanges,
      activeListings,
      totalListings,
      averageRating: user.rating,
      totalSaved,
      unreadCount,
      recentMessages,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/users/exchanges — completed exchange history with reviews.
exports.getExchangeHistory = async (req, res) => {
  try {
    const uid = req.user.id;

    const meetups = await Meetup.find({
      status: "completed",
      $or: [{ proposedBy: uid }, { proposedTo: uid }],
    })
      .populate("book", "title price photos")
      .populate("proposedBy", "name avatar")
      .populate("proposedTo", "name avatar")
      .sort({ updatedAt: -1 });

    const exchanges = await Promise.all(
      meetups.map(async (m) => {
        const other =
          idStr(m.proposedBy) === uid ? m.proposedTo : m.proposedBy;

        const [reviewGiven, reviewReceived] = await Promise.all([
          Review.findOne({ reviewer: uid, meetup: m._id }),
          Review.findOne({ reviewee: uid, meetup: m._id }),
        ]);

        return {
          meetup: {
            _id: m._id,
            date: m.date,
            location: m.location,
            status: m.status,
            completedAt: m.updatedAt,
          },
          book: m.book,
          otherUser: other,
          reviewGiven: reviewGiven || null,
          reviewReceived: reviewReceived || null,
        };
      })
    );

    return sendSuccess(res, 200, exchanges);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/users/wishlist — the user's saved books.
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: { path: "seller", select: "name rating location" },
    });
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, user.wishlist || []);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// POST /api/users/wishlist/:bookId — add a book to the wishlist.
exports.addToWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { wishlist: req.params.bookId } },
      { new: true }
    );
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, user.wishlist, "Added to wishlist");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// DELETE /api/users/wishlist/:bookId — remove a book from the wishlist.
exports.removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: req.params.bookId } },
      { new: true }
    );
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, user.wishlist, "Removed from wishlist");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
