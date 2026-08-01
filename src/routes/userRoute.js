const express = require("express");
const router = express.Router();

const {
  createUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getDashboard,
  getAllUsers,
  userLogout,
  deleteUser,
  toggleBlockUser,
  getEnrolledCourses,
} = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Routes
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/dashboard", protect, getDashboard); // New dashboard route
router.get("/enrolled-courses", protect, getEnrolledCourses); // Student only
router.get("/", protect, adminOnly, getAllUsers); // Only Admin can see all users
router.post("/logout", protect, userLogout);

// Admin routes for managing users
router.delete("/delete", protect, adminOnly, deleteUser); // Query param ?id=...
router.delete("/:id", protect, adminOnly, deleteUser); // Path param
router.patch("/block", protect, adminOnly, toggleBlockUser); // Query param ?id=...
router.patch("/:id/block", protect, adminOnly, toggleBlockUser); // Path param

module.exports = router;
