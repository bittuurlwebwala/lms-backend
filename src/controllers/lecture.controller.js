const Lecture = require("../models/lecture.model");
const Course = require("../models/course.model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { uploadOnCloudinary } = require("../utils/cloudinary");
const os = require("os");

// Use OS temporary directory for Vercel compatibility
const uploadDir = os.tmpdir();

// Multer storage configuration for videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `lecture-${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  },
});

// Configure upload middleware to accept any file field
const upload = multer({
  storage: storage,
}).any();

//console.log("req body", req.body);

// @desc    Add a new lecture
// @route   POST /api/lectures/create
// @access  Private
const createLecture = async (req, res) => {
  upload(req, res, async function (err) {
    // console.log("video", req.file);
    // console.log("req body", req.body);

    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        message: "Video upload failed: " + err.message,
        error: err.message,
      });
    }

    try {
      const { title, description, courseId, isFreePreview } = req.body;

      if (!title || !courseId) {
        return res.status(400).json({
          success: false,
          message: "Title and Course ID are required",
        });
      }

      // Verify the course exists
      const courseExists = await Course.findById(courseId);
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      // Get video URL from either uploaded multipart file or direct URL string
      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      const uploadedVideoFile =
        uploadedFiles.find((file) =>
          ["video", "videoUrl", "file"].includes(file.fieldname),
        ) ||
        uploadedFiles[0] ||
        null;

      let videoUrl =
        typeof req.body.videoUrl === "string" ? req.body.videoUrl.trim() : null;

      if (uploadedVideoFile) {
        const cloudinaryResponse = await uploadOnCloudinary(
          uploadedVideoFile.path,
        );
        if (cloudinaryResponse?.secure_url) {
          videoUrl = cloudinaryResponse.secure_url;
        } else {
          return res.status(400).json({
            success: false,
            message:
              "Video upload failed. Please check Cloudinary configuration or file type.",
          });
        }
      }

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          message: "Video file or videoUrl is required",
        });
      }

      const lecture = await Lecture.create({
        title,
        description,
        videoUrl,
        course: courseId,
        isFreePreview: isFreePreview === "true" || isFreePreview === true,
      });

      res.status(201).json({
        success: true,
        message: "Lecture added successfully",
        data: lecture,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  });
};

// @desc    Get all lectures for a specific course
// @route   GET /api/lectures/getLectures?courseId=...
// @access  Public / Private
const getCourseLectures = async (req, res) => {
  try {
    const courseId = req.query.courseId || req.params.courseId;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a course ID",
      });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const isFreeCourse = course.isFree === true || Number(course.price) === 0;
    const userEnrolledCourseIds =
      req.user?.enrolledCourses?.map((id) => id.toString()) || [];
    const isPurchased = userEnrolledCourseIds.includes(courseId.toString());

    const lectures = await Lecture.find({ course: courseId });

    res.status(200).json({
      success: true,
      count: lectures.length,
      data: lectures,
      access: {
        isPurchased,
        isFreeCourse,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching lectures",
      error: error.message,
    });
  }
};

// @desc    Delete a lecture
// @route   DELETE /api/lectures/:id
// @access  Private
const deleteLecture = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a lecture ID" });
    }

    const lecture = await Lecture.findByIdAndDelete(id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error deleting lecture",
      error: error.message,
    });
  }
};

module.exports = {
  createLecture,
  getCourseLectures,
  deleteLecture,
};
