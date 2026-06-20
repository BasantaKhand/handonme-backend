const express = require("express");
const bookController = require("../controllers/bookController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", bookController.getBooks);
router.get("/:id", bookController.getBookById);
router.post("/", protect, upload.array("photos", 5), bookController.createBook);
router.put("/:id", protect, bookController.updateBook);
router.delete("/:id", protect, bookController.deleteBook);

module.exports = router;
