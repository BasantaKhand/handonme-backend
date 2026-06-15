const Book = require("../models/Book");
const { sendSuccess, sendError } = require("../utils/helpers");

// Create a new book listing. Photos are handled by multer (req.files).
exports.createBook = async (req, res) => {
  try {
    const photos = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const book = await Book.create({
      ...req.body,
      photos: photos.length ? photos : req.body.photos || [],
      seller: req.user.id,
    });
    return sendSuccess(res, 201, book, "Book listed successfully");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// List all books with optional filters.
exports.getBooks = async (req, res) => {
  try {
    const { subject, condition, exchangeType, status } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (condition) filter.condition = condition;
    if (exchangeType) filter.exchangeType = exchangeType;
    if (status) filter.status = status;

    const books = await Book.find(filter)
      .populate("seller", "name rating location")
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, books);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get a single book and increment its view count.
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("seller", "name rating location");
    if (!book) return sendError(res, 404, "Book not found");
    return sendSuccess(res, 200, book);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update a book listing (only by its seller).
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return sendError(res, 404, "Book not found");
    if (book.seller.toString() !== req.user.id) {
      return sendError(res, 403, "Not authorized to update this book");
    }
    Object.assign(book, req.body);
    await book.save();
    return sendSuccess(res, 200, book, "Book updated");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Delete a book listing (only by its seller).
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return sendError(res, 404, "Book not found");
    if (book.seller.toString() !== req.user.id) {
      return sendError(res, 403, "Not authorized to delete this book");
    }
    await book.deleteOne();
    return sendSuccess(res, 200, null, "Book deleted");
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
