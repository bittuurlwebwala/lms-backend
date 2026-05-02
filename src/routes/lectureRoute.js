const express = require("express");
const router = express.Router();
const { createLecture, getCourseLectures, deleteLecture } = require("../controllers/lecture.controller");
const { protect } = require("../middleware/authMiddleware");

// Routes for lectures
router.post("/createLecture", protect, createLecture); // Protect allows only logged in instructors/admins
router.get("/getLectures", protect ,getCourseLectures); // Public or protect depending on your logic
router.delete("/deleteLecture/:id", protect, deleteLecture); 

module.exports = router;
