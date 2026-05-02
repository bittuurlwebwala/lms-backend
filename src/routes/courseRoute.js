const express = require("express");
const router = express.Router();

const {
    createCourse,
    getAllCourses,
    getCourseById,
    deleteCourse,
    togglePublishCourse,
    enrollCourse
} = require("../controllers/course.controller");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.post("/create-course", createCourse); // Handles both create and update
router.get("/all-courses", protect, getAllCourses);
router.get("/:id", protect,  getCourseById);
router.delete("/:id", protect, deleteCourse); // Protected route, only logged in users (or admins depending on logic) can delete
router.patch("/:id/publish", protect, togglePublishCourse); // Protected route for toggling publish status

// Student actions
router.post("/enroll", protect, enrollCourse); // Expects ?id=... in query or body

module.exports = router;
