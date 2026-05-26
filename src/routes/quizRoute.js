const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const {
    createQuiz,
    getQuizzesByCourse,
    attemptQuiz,
    getMyQuizResults
} = require("../controllers/quiz.controller");
const { protect } = require("../middleware/authMiddleware");

router.post("/add", protect, upload.none(), createQuiz);
router.get("/course", protect, getQuizzesByCourse);
router.post("/attempt", protect, upload.none(), attemptQuiz);
router.get("/quizresults", protect, getMyQuizResults);

module.exports = router;