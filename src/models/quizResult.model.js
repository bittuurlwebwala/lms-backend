const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    isPassed: {
        type: Boolean,
        required: true
    },
    answers: [{
        questionId: String,
        selectedOption: Number,
        isCorrect: Boolean
    }]
}, {
    timestamps: true,
    versionKey: false
});

const QuizResult = mongoose.model("QuizResult", quizResultSchema);
module.exports = QuizResult;
