const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
        required: true
    },
    currentPosition: {
        type: Number,
        default: 0 // in seconds
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});

// Ensure one progress record per user per lecture
progressSchema.index({ user: 1, lecture: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);
module.exports = Progress;
