const Quiz = require("../models/quiz.model");
const QuizResult = require("../models/quizResult.model");

// @desc    Create a quiz
// @route   POST /api/quizzes/create
// @access  Private (Admin/Teacher)
const createQuiz = async (req, res) => {
    try {
        let { course, title, description, timer, passingMarks, questions } = req.body || {};

        console.log("--- Create Quiz Attempt ---");
        console.log("Body:", req.body);

        // Handle if questions is sent as a string (common in form-data)
        if (typeof questions === 'string') {
            try {
                questions = JSON.parse(questions);
            } catch (e) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Questions must be a valid JSON array" 
                });
            }
        }

        if (!course || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide course, title, and at least one question in an array" 
            });
        }

        const quiz = await Quiz.create({
            course,
            title,
            description,
            timer: Number(timer) || 10,
            passingMarks: Number(passingMarks) || 0,
            questions
        });

        console.log("Quiz Created Successfully:", quiz._id);

        res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            data: quiz
        });
    } catch (error) {
        console.error("Quiz Creation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error during quiz creation", 
            error: error.message 
        });
    }
};

// @desc    Get quizzes for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
const getQuizzesByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId || req.query.courseId;
        const quizzes = await Quiz.find({ course: courseId });
        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// @desc    Attempt a quiz
// @route   POST /api/quizzes/:id/attempt
// @access  Private (Student)
const attemptQuiz = async (req, res) => {
    try {
        const id = req.params.id || req.body.quizId || req.query.quizId;
        let { answers } = req.body; // Array of selected indices

        if (!id) {
            return res.status(400).json({ success: false, message: "Please provide a Quiz ID" });
        }

        // Handle stringified answers from form-data
        if (typeof answers === 'string') {
            try {
                answers = JSON.parse(answers);
            } catch (e) {
                return res.status(400).json({ success: false, message: "Answers must be a valid JSON array" });
            }
        }
        const userId = req.user._id;

        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        let score = 0;
        const processedAnswers = quiz.questions.map((q, index) => {
            const selectedOption = answers[index];
            const isCorrect = selectedOption === q.correctAnswer;
            if (isCorrect) score++;
            return {
                questionId: q._id,
                selectedOption,
                isCorrect
            };
        });

        const isPassed = score >= quiz.passingMarks;

        const result = await QuizResult.create({
            user: userId,
            quiz: id,
            score,
            totalQuestions: quiz.questions.length,
            isPassed,
            answers: processedAnswers
        });

        res.status(200).json({
            success: true,
            message: isPassed ? "Congratulations! You passed." : "You did not pass. Try again.",
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// @desc    Get quiz results for a user
// @route   GET /api/quizzes/results
// @access  Private
const getMyQuizResults = async (req, res) => {
    try {
        const results = await QuizResult.find({ user: req.user._id }).populate("quiz", "title");
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = {
    createQuiz,
    getQuizzesByCourse,
    attemptQuiz,
    getMyQuizResults
};
