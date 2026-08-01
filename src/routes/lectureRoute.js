const express = require("express");
const router = express.Router();
const {
  createLecture,
  getCourseLectures,
  deleteLecture,
} = require("../controllers/lecture.controller");
const { protect, optionalProtect } = require("../middleware/authMiddleware");

// Routes for lectures
router.post("/createLecture", protect, createLecture); // Protect allows only logged in instructors/admins
router.get("/getLectures", optionalProtect, getCourseLectures);
router.delete("/deleteLecture/:id", protect, deleteLecture);

module.exports = router;
