const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    timer: {
        type: Number, // in minutes
        default: 10
    },
    passingMarks: {
        type: Number,
        default: 0
    },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true } // index of options
    }]
}, {
    timestamps: true,
    versionKey: false
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
