const express = require("express");
const router = express.Router();
const { submitContactForm, getAllContacts } = require("../controllers/contact.controller");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// POST /api/contact - Public
router.post("/", submitContactForm);

// GET /api/contact - Admin only
router.get("/", protect, adminOnly, getAllContacts);

module.exports = router;
