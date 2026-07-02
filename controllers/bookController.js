const Book = require("../models/Book");
const { sendSuccess, sendError } = require("../utils/helpers");

// Fields returned when populating the seller reference.
const SELLER_FIELDS =
  "name rating totalExchanges isVerified verificationBadge location";

// Build a case-insensitive regex that treats input as a literal (no injection).
const literalRegex = (value) =>
  new RegExp(String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

// Map uploaded files (from multer) to their public URL paths.
const filePaths = (files) =>
  (files || []).map((file) => `/uploads/books/${file.filename}`);

// Create a new book listing. Photos are handled by multer (req.files).
exports.createBook = async (req, res) => {
  try {
    const photos = filePaths(req.files);
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

// List books with search, filtering, and price range support.
exports.getBooks = async (req, res) => {
  try {
    const {
      search,
      condition,
      exchangeType,
      minPrice,
      maxPrice,
      location,
      subject,
      status,
      seller,
    } = req.query;

    const filter = {};
    if (condition) filter.condition = condition;
    if (exchangeType) filter.exchangeType = exchangeType;
    if (subject) filter.subject = subject;
    if (status) filter.status = status;
    if (seller) filter.seller = seller;
    if (location) filter.location = literalRegex(location);

    // Price range: only add bounds that are provided.
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Free-text search across title, author, and subject (case-insensitive).
    if (search) {
      const term = literalRegex(search);
      filter.$or = [{ title: term }, { author: term }, { subject: term }];
    }

    const books = await Book.find(filter)
      .populate("seller", SELLER_FIELDS)
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, { count: books.length, books });
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
    ).populate("seller", SELLER_FIELDS);
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

    // Apply only the provided fields.
    Object.assign(book, req.body);

    // Replace photos if new files were uploaded.
    const photos = filePaths(req.files);
    if (photos.length) {
      book.photos = photos;
    }

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
