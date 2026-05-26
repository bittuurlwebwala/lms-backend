const express = require("express");
const router = express.Router();
const { updateProgress, getCourseProgress } = require("../controllers/progress.controller");
const { protect } = require("../middleware/authMiddleware");

const multer = require("multer");
const upload = multer();

router.post("/updateProgress", protect, upload.none(), updateProgress);
router.get("/getCourseProgress", protect, getCourseProgress);

module.exports = router;


