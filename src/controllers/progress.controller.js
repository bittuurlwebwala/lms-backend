const Progress = require("../models/progress.model");
const Lecture = require("../models/lecture.model");

// @desc    Update video progress
// @route   POST /api/progress/update
// @access  Private (Student)
const updateProgress = async (req, res) => {
    try {
        const { courseId, lectureId, currentPosition, isCompleted } = req.body;
        const userId = req.user._id;

        if (!courseId || !lectureId) {
            return res.status(400).json({ success: false, message: "Course and Lecture IDs are required" });
        }

        let progress = await Progress.findOne({ user: userId, lecture: lectureId });

        if (progress) {
            if (currentPosition !== undefined) progress.currentPosition = currentPosition;
            if (isCompleted !== undefined) progress.isCompleted = isCompleted;
            await progress.save();
        } else {
            progress = await Progress.create({
                user: userId,
                course: courseId,
                lecture: lectureId,
                currentPosition: currentPosition || 0,
                isCompleted: isCompleted || false
            });
        }

        res.status(200).json({
            success: true,
            message: "Progress updated",
            data: progress
        });
    } catch (error) {
        console.error("Update Progress Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// @desc    Get progress for a course
// @route   GET /api/progress/:courseId
// @access  Private (Student)
const getCourseProgress = async (req, res) => {
    try {
        const courseId = req.params.courseId || req.query.courseId;
        const userId = req.user._id;

        const totalLectures = await Lecture.countDocuments({ course: courseId });
        const completedLectures = await Progress.countDocuments({ 
            user: userId, 
            course: courseId, 
            isCompleted: true 
        });

        const progressRecords = await Progress.find({ user: userId, course: courseId });

        const percentage = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                totalLectures,
                completedLectures,
                percentage: Math.round(percentage),
                history: progressRecords
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = {
    updateProgress,
    getCourseProgress
};
