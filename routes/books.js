const express = require("express");
const bookController = require("../controllers/bookController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", bookController.getBooks);
router.get("/:id", bookController.getBookById);
router.post("/", auth, upload.array("photos", 5), bookController.createBook);
router.put("/:id", auth, bookController.updateBook);
router.delete("/:id", auth, bookController.deleteBook);

module.exports = router;
